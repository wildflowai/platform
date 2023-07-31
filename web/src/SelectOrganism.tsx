import React from "react";
import AsyncSelect from "react-select/async";
import Markdown from "react-markdown";
import { OrganismContext, useOrganismSearch } from "./OrganismProvider";

const SelectOrganism: React.FC = () => {
  const { organism, setOrganism, loadOrganisms, inputValue } =
    React.useContext(OrganismContext);

  const formatOptionLabel = (data: any): React.ReactNode => {
    const [id, name, records] = data.organismName.split("|");
    const highlightedName =
      inputValue.length === 0
        ? name
        : name.split(inputValue).join(`**${inputValue}**`);
    return (
      <div className="flex justify-between items-center text-gray-700">
        <div className="bg-green-200 text-black rounded p-1 font-mono">
          {id}
        </div>
        <Markdown className="flex-grow mx-2">{highlightedName}</Markdown>
        <div className="text-right font-mono">{records}</div>
      </div>
    );
  };

  const handleSelectionChange = (selected: any) => {
    if (selected) {
      setOrganism({
        gbifId: selected.gbifId,
        name: selected.organismName.split(" | ")[1],
      });
    }
  };

  return (
    <AsyncSelect
      className="w-1/3"
      cacheOptions
      loadOptions={loadOrganisms}
      defaultOptions
      value={{
        gbifId: organism.gbifId,
        organismName: ` | ${organism.name}`,
      }}
      getOptionLabel={(option) => option.organismName.split(" | ")[1]}
      getOptionValue={(option) => String(option.gbifId)}
      onChange={handleSelectionChange}
      formatOptionLabel={formatOptionLabel}
    />
  );
};

export default SelectOrganism;
