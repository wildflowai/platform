import React, { useReducer, useEffect, ChangeEvent, useState } from "react";
import ShowText from "./ShowText";

interface State {
  headers: string[];
  tableName: string;
  hasHeader: boolean;
  columnValidity: boolean[];
  isTableNameValid: boolean;
  error: string | null;
}

interface Action {
  type: string;
  payload?: any;
}

const actionTypes = {
  SET_HEADERS: "SET_HEADERS",
  SET_TABLE_NAME: "SET_TABLE_NAME",
  SET_HAS_HEADER: "SET_HAS_HEADER",
  VALIDATE_HEADERS: "VALIDATE_HEADERS",
  VALIDATE_TABLE_NAME: "VALIDATE_TABLE_NAME",
};

const validateHeaders = (headers: string[]): [boolean[], boolean] => {
  const headerSet = new Set();
  const validity = headers.map((header) => {
    const isValidHeader = /^[A-Za-z_][A-Za-z0-9_]*$/.test(header);
    if (!isValidHeader || headerSet.has(header)) {
      return false;
    }
    headerSet.add(header);
    return true;
  });
  return [validity, headerSet.size === headers.length];
};

const validateTableName = (tableName: string): boolean => {
  return /^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/.test(tableName);
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case actionTypes.SET_HEADERS:
      return { ...state, headers: action.payload };
    case actionTypes.SET_TABLE_NAME:
      return { ...state, tableName: action.payload };
    case actionTypes.SET_HAS_HEADER:
      return { ...state, hasHeader: action.payload };
    case actionTypes.VALIDATE_HEADERS: {
      const [newColumnValidity, headersValid] = validateHeaders(state.headers);
      const error = !headersValid
        ? "Column names must be unique, cannot start with a digit, and can only contain letters, digits, and underscores."
        : null;
      return { ...state, columnValidity: newColumnValidity, error };
    }
    case actionTypes.VALIDATE_TABLE_NAME: {
      const isValid = validateTableName(state.tableName);
      const error = isValid
        ? null
        : "Table name must be in the format dataset_id.table_id, and can only contain letters, digits, and underscores.";
      return { ...state, isTableNameValid: isValid, error };
    }
    default:
      return state;
  }
}

interface PreviewAndIngestProps {
  data: any[];
  onIngest: (headers: string[], hasHeader: boolean, tableName: string) => void;
}

const PreviewAndIngest: React.FC<PreviewAndIngestProps> = ({
  data,
  onIngest,
}) => {
  const initialState: State = {
    headers: data[0]
      .map(String)
      .map((header: string) => header.replace(/\./g, "_")),

    tableName: "raw.ingested_table_name",
    hasHeader: true,
    columnValidity: data[0].map(() => true),
    isTableNameValid: true,
    error: null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    dispatch({ type: actionTypes.VALIDATE_HEADERS });
  }, [state.headers]);

  useEffect(() => {
    dispatch({ type: actionTypes.VALIDATE_TABLE_NAME });
  }, [state.tableName]);

  useEffect(() => {
    if (state.hasHeader) {
      const initialHeaders = data[0].map((header: string) =>
        String(header).replace(/\./g, "_")
      );
      dispatch({ type: actionTypes.SET_HEADERS, payload: initialHeaders });
    } else {
      const initialHeaders = data[0].map(
        (_: any, index: any) => `Column${index + 1}`
      );
      dispatch({ type: actionTypes.SET_HEADERS, payload: initialHeaders });
    }
  }, [state.hasHeader, data]);

  const handleHeaderChange = (index: number, newName: string) => {
    const newHeaders = [...state.headers];
    newHeaders[index] = newName;
    dispatch({ type: actionTypes.SET_HEADERS, payload: newHeaders });
  };

  const handleTableNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: actionTypes.SET_TABLE_NAME, payload: e.target.value });
  };

  const handleHasHeaderChange = () => {
    dispatch({ type: actionTypes.SET_HAS_HEADER, payload: !state.hasHeader });
  };

  const handleIngest = () => {
    if (
      state.error ||
      !state.isTableNameValid ||
      state.columnValidity.includes(false)
    )
      return;
    setStatus("Starting ingestion job...");
    onIngest(state.headers, state.hasHeader, state.tableName);
  };

  const rowData = state.hasHeader ? data.slice(1) : data;

  if (status) {
    return <ShowText text={status} />;
  }

  return (
    <div className="p-4">
      {state.error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700">
          {state.error}
        </div>
      )}
      <label>
        <input
          type="checkbox"
          checked={state.hasHeader}
          onChange={handleHasHeaderChange}
          className="mr-2"
        />
        Input file has header
      </label>
      <input
        type="text"
        value={state.tableName}
        onChange={handleTableNameChange}
        placeholder="Your table name"
        className={`border p-2 w-full text-black ${
          !state.isTableNameValid && "bg-red-300"
        }`}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {state.headers.map((header, index) => (
                <th key={index} className="border px-4 py-2">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className={`p-1 text-black font-normal ${
                      !state.columnValidity[index] && "bg-red-300"
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value: any, index: any) => (
                  <td
                    key={index}
                    className={`border px-4 py-2 ${
                      value === null && "bg-orange-300"
                    }`}
                  >
                    {value !== null ? value : "NULL"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleIngest}
        className={`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
          state.error ||
          !state.isTableNameValid ||
          state.columnValidity.includes(false)
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        disabled={
          Boolean(state.error) ||
          !state.isTableNameValid ||
          state.columnValidity.includes(false)
        }
      >
        Ingest
      </button>
    </div>
  );
};

export default PreviewAndIngest;
