const pathname = window.location.pathname;
const pathSegments = pathname.split("/").filter((segment) => segment !== "");
const category = pathSegments[0]; // This will be 'doctors' or 'clinic' based on the URL

console.log(category);

categories = {
  doctors: "alldoctors",
  clinics: "allclinic",
  patients: "allpatients",
  undefined: "alldata",
};

onload(category);

async function onload() {
  console.log("I AM HERE");
  body = {
    data: categories[category],
  };

  const response = await fetch(`/alldata`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status == 200) {
    let rowsJson = await response.json();
    const rows = rowsJson.rows;
    createTable(rows);
  }
}

function createTable(rows) {
  const table = document.createElement("table");
  const headers = Object.keys(rows[0]);

  // Create table headers
  const headerRow = table.insertRow();
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });

  // Create table rows with data
  rows.forEach((rowData) => {
    const row = table.insertRow();
    headers.forEach((header) => {
      const cell = row.insertCell();
      cell.textContent = rowData[header];
    });
  });

  // Append table to a container in the HTML document
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = ""; // Clear previous content
  tableContainer.appendChild(table);
}
