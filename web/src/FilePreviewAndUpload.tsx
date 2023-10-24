import React, { useEffect, useState } from "react";
import Papa from "papaparse";

const FilePreviewAndUpload: React.FC<{
  file: File;
  onUpload: (data: any[], tableName: string) => void;
}> = ({ file, onUpload }) => {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [tableName, setTableName] = useState<string>("raw.uploaded_table_name");

  useEffect(() => {
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        preview: 50,
        complete: (result) => {
          setData(result.data);
          setHeaders(result.meta.fields as string[]);
        },
      });
    }
  }, [file]);

  const handleHeaderChange = (index: number, newName: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = newName;
    setHeaders(newHeaders);
  };

  const handleUpload = () => {
    onUpload(data, tableName);
  };

  const nRows = 10;

  return (
    <div className="p-4">
      <input
        type="text"
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
        placeholder="Your table name"
        className="border p-2 w-full text-black w-128"
      />
      <div className="overflow-x-auto">
        <div className="my-2 text-orange-500">
          Note: only the first {nRows} rows are displayed for preview.
        </div>

        <table className="min-w-full">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border px-4 py-2">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="p-1 text-black font-normal"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, nRows).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((header) => (
                  <td key={header} className="border px-4 py-2">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleUpload}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Upload
      </button>
    </div>
  );
};

export default FilePreviewAndUpload;
