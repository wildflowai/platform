type TableName = string;
type TableIndex = string;
type TableKey = `${TableName}|${TableIndex}`;

type ColumnType = {
  name: string;
  newName: string;
  type: "date" | "latitude" | "longitude" | "";
  selected: boolean;
};

export type DataStructure = Record<TableKey, ColumnType[]>;

const shortTableName = (tableKey: TableKey) => {
  return "t" + tableKey.split("|")[1];
};

export const generateSQLCode = (projectId: string, data: DataStructure) => {
  const allTableKeys = Object.keys(data);
  const mainTableKey = allTableKeys.find((tableKey) =>
    tableKey.endsWith("|0")
  ) as TableKey;
  if (!mainTableKey) {
    throw new Error("No main table found");
  }

  const tableName = (tk: TableKey): string => {
    return `\`${projectId}.${tk.split("|")[0]}\``;
  };

  const getColumn = (tableKey: TableKey, columnType: string): ColumnType => {
    const res = data[tableKey].find((c) => c.type === columnType);
    if (res === undefined) {
      throw new Error(`No ${columnType} column found for table ${tableKey}`);
    }
    return res;
  };

  const uniqueLocations = (tableKey: TableKey): string => {
    const latColumn = getColumn(tableKey, "latitude");
    const lonColumn = getColumn(tableKey, "longitude");
    const shortName = shortTableName(tableKey);

    return `
    ${shortName}_locations as (
      select distinct
        ${latColumn.name} as ${shortName}_lat,
        ${lonColumn.name} as ${shortName}_lon
      from ${tableName(tableKey)}
    )`;
  };

  const minDistance = (a: TableKey, b: TableKey): string => {
    const aName = shortTableName(a);
    const bName = shortTableName(b);
    return `
    ${aName}_${bName}_min_dist as (
      select
        a.${aName}_lat,
        a.${aName}_lon,
        array_agg(
          struct(b.${bName}_lat, b.${bName}_lon)
          order by st_distance(
            st_geogpoint(a.${aName}_lon, a.${aName}_lat),
            st_geogpoint(b.${bName}_lon, b.${bName}_lat))
          limit 1
        )[offset(0)].*
      from ${aName}_locations a
      cross join ${bName}_locations b
      group by 1, 2
    )`;
  };

  const leftJoin = (a: TableKey, b: TableKey): string => {
    const aName = shortTableName(a);
    const bName = shortTableName(b);
    const aLat = getColumn(a, "latitude").name;
    const aLon = getColumn(a, "longitude").name;
    const aDate = getColumn(a, "date").name;
    const bLat = getColumn(b, "latitude").name;
    const bLon = getColumn(b, "longitude").name;
    const bDate = getColumn(b, "date").name;
    return `
    left join ${aName}_${bName}_min_dist ${aName}${bName} on (
      ${shortTableName(a)}.${aLat} = ${aName}${bName}.${aName}_lat
      and ${shortTableName(a)}.${aLon} = ${aName}${bName}.${aName}_lon
    )
    left join ${tableName(b)} ${shortTableName(b)} on (
      date(${aName}.${aDate}) = date(${bName}.${bDate})
      and ${aName}${bName}.${bName}_lat = ${bName}.${bLat}
      and ${aName}${bName}.${bName}_lon = ${bName}.${bLon}
    )`;
  };

  const selectStatement =
    "\n    select\n" +
    allTableKeys
      .map((tk) => {
        const tableKey = tk as TableKey;
        const shortName = shortTableName(tableKey);
        return data[tableKey]
          .filter((column) => column.selected)
          .map(
            (column: ColumnType) =>
              `      ${shortName}.${column.name} as \`${column.newName}\``
          )
          .join(",\n");
      })
      .join(",\n");

  const locations =
    allTableKeys
      .map((t) => t as TableKey)
      .map(uniqueLocations)
      .join(",\n") + ",\n";

  const minDistances = allTableKeys
    .slice(1)
    .map((t) => t as TableKey)
    .map((t) => minDistance(mainTableKey, t))
    .join(",\n");

  const leftJoins = allTableKeys
    .slice(1)
    .map((t) => t as TableKey)
    .map((t) => leftJoin(mainTableKey, t))
    .join("\n");

  const mainTable = `    from ${tableName(mainTableKey)} ${shortTableName(
    mainTableKey
  )}`;

  const newTableName = "raw.results";
  return [
    `create or replace table \`${projectId}.${newTableName}\` as (`,
    [
      "    with",
      locations,
      minDistances,
      selectStatement,
      mainTable,
      leftJoins,
    ].join("\n"),
    ");",
  ].join("\n");
};
