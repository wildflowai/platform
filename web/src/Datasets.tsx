import React from "react";

const bigQueyrLink =
  "https://console.cloud.google.com/bigquery?project=wildflow-demo&ws=!1m4!1m3!3m2!1swildflow-demo!2sclean";

const Datasets: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <h1>
        Here we're going to list standardized datasets from our{" "}
        <a className="text-xl text-blue-500" href={bigQueyrLink}>
          BigQuery
        </a>
      </h1>
    </div>
  );
};

export default Datasets;
