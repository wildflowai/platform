export const projectId = (): string => {
  return localStorage.getItem("wildflow-project-id") || "no-projectId";
};
const token = (): string => {
  return localStorage.getItem("wildflow-invite-token") || "no-invite-token";
};

//const _BACKEND_DOMAIN = "http://127.0.0.1:5001/wildflow-demo/us-central1";
const _BACKEND_DOMAIN = "https://us-central1-wildflow-demo.cloudfunctions.net";

export const getAllTablesForProject = async () => {
  const response = await fetch(`${_BACKEND_DOMAIN}/listDatasetsForProject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: token(),
      projectId: projectId(),
    }),
  });
  const data = await response.json();
  return data;
};

export const mergeTablesMinDistance = async (
  newTableName: string,
  data: any,
  noRunOnlyCode: boolean = true
) => {
  const response = await fetch(`${_BACKEND_DOMAIN}/mergeTablesMinDistance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: token(),
      noRunOnlyCode: noRunOnlyCode,
      projectId: projectId(),
      payload: data,
      newTableName: newTableName,
    }),
  });
  if (noRunOnlyCode) {
    return response.text();
  } else {
    return response.json();
  }
};

// example response is:
// {
//   status: "DONE",
//   progress: 0,
//   creationTime: "1697831824537",
//   endTime: "1697831826953",
//   totalBytesProcessed: "3809384",
//   cacheHit: false,
// };
// another example
// { error: "Job execution was cancelled: User requested cancellation" };
export const checkJobStatus = async (jobId: string) => {
  const response = await fetch(`${_BACKEND_DOMAIN}/checkJobStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: token(),
      projectId: projectId(),
      jobId: jobId,
    }),
  });
  return await response.json();
};

export const cancelJob = async (jobId: string) => {
  const response = await fetch(`${_BACKEND_DOMAIN}/cancelJob`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: token(),
      projectId: projectId(),
      jobId: jobId,
    }),
  });
  return await response.json();
};

export const getColumnsForTables = async (tables: string[]) => {
  const response = await fetch(`${_BACKEND_DOMAIN}/getColumnsForTables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: token(),
      projectId: projectId(),
      tables: tables,
    }),
  });
  return response.json();
};

export const getColumnsForTable = async (
  datasetId: string,
  tableId: string
) => {
  try {
    const response = await fetch(`${_BACKEND_DOMAIN}/sampleBigQueryTable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token(),
        projectId: projectId(),
        datasetId: datasetId,
        tableId: tableId,
      }),
    });

    if (!response.ok) {
      // Return an error message based on the status code
      return {
        success: false,
        message: `HTTP error! Status: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error("There has been a problem with your fetch operation:", error);
    return {
      success: false,
      message: error.message || "Unknown error occurred",
    };
  }
};
