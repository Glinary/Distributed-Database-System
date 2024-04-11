const statusSel = document.querySelector("#opSelect");
const region = document.querySelector("#regSelect");

let pageNum = 1;
const itemSize = 20;
let totalRows = 0;
let statusSelected = "Queued";
let regionSelected = "central";

onload();

// Event listener for 'change' event on the select element
statusSel.addEventListener("change", (event) => {
  statusSelected = event.target.value;
  console.log(statusSelected);
  onload();
});

// Event listener for 'change' event on the select element
region.addEventListener("change", (event) => {
  regionSelected = event.target.value;
  console.log("Region: ", regionSelected);
  onload();
});

function onload() {
  checkCount();
  fetchData();
}

async function checkCount() {
  const body = { region: regionSelected, status: statusSelected };
  console.log("Region, Status: ", body.region, body.status);

  const responseCount = await fetch(`/dataCountReport`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (responseCount.status == 200) {
    let rowsJson = await responseCount.json();
    totalRows = rowsJson.rows[0][0].count;
    console.log("TOTAL ROWS: ", totalRows);
  }
}

async function fetchData() {
  const body = { region: regionSelected, status: statusSelected, pageNum: pageNum };
  // do query

  const response = await fetch(`/reportstats`, {
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

nextButton.addEventListener("click", () => {
  if ((pageNum - 1) * 15 <= totalRows) {
    pageNum++;
  }
  onload();
});

prevButton.addEventListener("click", () => {
  if (pageNum > 1) {
    pageNum--;
  }
  onload();
});
