import React, { useState, ChangeEvent, useEffect } from "react";

interface ShowTextProps {
  text: string;
}

const ShowText: React.FC<ShowTextProps> = ({ text }) => <div>{text}</div>;

interface PreviewAndIngestProps {
  data: (string | null)[][];
  onUpload: (
    newHeaders: string[],
    hasHeader: boolean,
    newTableName: string
  ) => void;
}

const PreviewAndIngest: React.FC<PreviewAndIngestProps> = ({
  data,
  onUpload,
}) => {
  const [headers, setHeaders] = useState<string[]>(data[0].map(String));
  const [tableName, setTableName] = useState<string>("raw.uploaded_table_name");
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [columnValidity, setColumnValidity] = useState<boolean[]>(
    headers.map(() => true)
  );
  const [isTableNameValid, setIsTableNameValid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateHeaders = (headers: string[]): [boolean[], boolean] => {
    const headerSet = new Set<string>();
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

  useEffect(() => {
    const initialHeaders = hasHeader
      ? data[0].map((header) => String(header).replace(/\./g, "_"))
      : data[0].map((_, index) => `Column${index + 1}`);

    setHeaders(initialHeaders);
    const [newColumnValidity, headersValid] = validateHeaders(initialHeaders);
    setColumnValidity(newColumnValidity);
    setError(
      !headersValid
        ? "Column names must be unique, cannot start with a digit, and can only contain letters, digits, and underscores."
        : null
    );
  }, [hasHeader, data]);

  useEffect(() => {
    console.log("Table Name State:", tableName);
    console.log("Is Table Name Valid:", isTableNameValid);
    console.log("Error State:", error);

    if (
      isTableNameValid &&
      error ===
        "Table name can only contain letters, digits, and underscores, and cannot start with a digit."
    ) {
      setError(null);
    }
  }, [tableName, isTableNameValid, error]);

  const handleHeaderChange = (index: number, newName: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = newName;

    const [newColumnValidity, headersValid] = validateHeaders(newHeaders);
    setHeaders(newHeaders);
    setColumnValidity(newColumnValidity);
    setError(
      !headersValid
        ? "Column names must be unique, cannot start with a digit, and can only contain letters, digits, and underscores."
        : null
    );
  };

  const handleTableNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTableName = e.target.value;
    setTableName(newTableName);
    const isValid = /^[A-Za-z_][A-Za-z0-9_]*$/.test(newTableName);
    setIsTableNameValid(isValid);

    if (isValid) {
      setError(null); // Clearing the error when the table name is valid
    } else {
      setError(
        "Table name can only contain letters, digits, and underscores, and cannot start with a digit."
      );
    }
  };

  const handleHasHeaderChange = () => {
    setHasHeader(!hasHeader);
  };

  const handleUpload = () => {
    if (error || !isTableNameValid || columnValidity.includes(false)) return;
    onUpload(headers, hasHeader, tableName);
  };

  const rowData = hasHeader ? data.slice(1) : data;

  return (
    <div className="p-4" key={error}>
      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700">
          {error}
        </div>
      )}
      <label>
        <input
          type="checkbox"
          checked={hasHeader}
          onChange={handleHasHeaderChange}
          className="mr-2"
        />
        Input file has header
      </label>
      <input
        type="text"
        value={tableName}
        onChange={handleTableNameChange}
        placeholder="Your table name"
        className={`border p-2 w-full text-black ${
          !isTableNameValid && "bg-red-300"
        }`}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border px-4 py-2">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className={`p-1 text-black font-normal ${
                      !columnValidity[index] && "bg-red-300"
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, index) => (
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
        onClick={handleUpload}
        className={`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
          error || !isTableNameValid || columnValidity.includes(false)
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        disabled={
          Boolean(error) || !isTableNameValid || columnValidity.includes(false)
        }
      >
        Upload
      </button>
    </div>
  );
};

export default PreviewAndIngest;
