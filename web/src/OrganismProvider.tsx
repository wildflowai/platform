import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_ENDPOINT =
  "https://us-central1-wildflow-demo.cloudfunctions.net/getSpeciesList";

const DEFAULT_ORGANISM = {
  gbifId: 256748140,
  name: "Phalacrocorax carbo",
};

interface OrganismContextType {
  organism: Organism;
  setOrganism: (organism: Organism) => void;
  loadOrganisms: (input: string) => Promise<OptionType[]>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
}

export const OrganismContext = createContext<OrganismContextType>({
  organism: DEFAULT_ORGANISM,
  setOrganism: () => {},
  loadOrganisms: async () => [],
  inputValue: "",
  setInputValue: () => {},
});

interface Organism {
  gbifId: number;
  name: string;
}

interface OptionType {
  gbifId: number;
  organismName: string;
}

export const useOrganismSearch = () => {
  const storedOrganism = localStorage.getItem("organism");
  const initialOrganism = storedOrganism
    ? JSON.parse(storedOrganism)
    : DEFAULT_ORGANISM;

  const [organism, setOrganism] = useState<Organism>(initialOrganism);
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("organism", JSON.stringify(organism));
  }, [organism]);

  const loadOrganisms = useCallback(
    async (input: string): Promise<OptionType[]> => {
      try {
        const res = await axios.get(`${API_ENDPOINT}?searchTerm=${input}`);
        const { species } = res.data;

        const organisms = species.map(
          (s: {
            gbif_id: number;
            verbatim_scientific_name: string;
            records_count: number;
          }) => ({
            gbifId: s.gbif_id,
            organismName: `${s.gbif_id} | ${s.verbatim_scientific_name} | ${s.records_count} records`,
          })
        );

        if (organisms.length > 0) {
          setOrganism({
            gbifId: organisms[0].gbifId,
            name: organisms[0].organismName.split(" | ")[1],
          });
        } else {
          setOrganism(DEFAULT_ORGANISM);
        }

        return organisms;
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    [setOrganism]
  );

  return { organism, setOrganism, loadOrganisms, inputValue, setInputValue };
};

export const OrganismProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const organismSearch = useOrganismSearch();
  return (
    <OrganismContext.Provider value={organismSearch}>
      {children}
    </OrganismContext.Provider>
  );
};
