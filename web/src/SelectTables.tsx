import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import Select from "react-select";
import cloneDeep from "lodash/cloneDeep";
import { TableInfo } from "./MergeTables";

const SelectTable: React.FC<any> = ({
  tables,
  handleSelect,
  selectedTables,
}: any) => {
  const { darkMode } = useContext(ThemeContext);

  const selectedOptions = selectedTables.map((table: TableInfo) => ({
    value: { datasetId: table.datasetId, tableId: table.id },
    label: `${table.datasetId}.${table.id}`,
    size: table.size,
    numRows: table.numRows,
  }));

  const selectOptions = tables.map((table: any) => ({
    value: { datasetId: table.datasetId, tableId: table.id },
    label: `${table.datasetId}.${table.id}`,
    size: table.size,
    numRows: table.numRows,
  }));

  const localHandleSelect = (
    selectedOptions: readonly any[],
    actionMeta: any
  ) => {
    const newSelectedTables = selectedOptions.map((selectedOption) =>
      tables.find(
        (table: any) =>
          table.id === selectedOption.value.tableId &&
          table.datasetId === selectedOption.value.datasetId
      )
    );
    handleSelect(newSelectedTables);
  };

  const colourStyles = {
    option: (styles: any, { data }: any) => {
      return {
        ...styles,
        backgroundColor: darkMode ? "rgb(26, 32, 44)" : "white",
        color: darkMode ? "white" : "black",
        fontSize: "14px",
      };
    },
    singleValue: (styles: any, { data }: any) => ({
      ...styles,
      color: "black",
    }),
    multiValueLabel: (styles: any) => ({
      ...styles,
      backgroundColor: darkMode ? "rgb(210, 210, 210)" : "rgb(210, 210, 210)",
      color: "black",
    }),

    control: (provided: any, state: any) => ({
      ...provided,
      boxShadow: "none", // Removes focus shadow
      borderColor: state.isFocused ? "transparent" : provided.borderColor, // Makes the border transparent only when focused
      "&:hover": {
        borderColor: provided.borderColor, // Restore the border on hover
      },
      outline: "none", // Remove the default browser outline
    }),
  };

  const formatOptionLabel = (option: any) => (
    <div>
      <span>{option.label}</span>
      <span style={{ marginLeft: "8px", color: "rgb(45, 81, 181)" }}>
        {option.size}
      </span>
      <span style={{ marginLeft: "8px", color: "rgb(133, 40, 0)" }}>
        {option.numRows} rows
      </span>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h1 className="text-2xl mb-4">Select tables to merge:</h1>
      <Select
        options={selectOptions}
        styles={colourStyles}
        formatOptionLabel={formatOptionLabel}
        isMulti={true}
        className={`block min-w-1/2 w-1/2 p-2 border rounded ${
          darkMode ? "bg-gray-700" : "bg-white"
        }`}
        onChange={localHandleSelect}
        value={selectedOptions} // Set the value prop to the previously selected options
      />
    </div>
  );
};

export default SelectTable;
