const pathname = window.location.pathname;
const pathSegments = pathname.split("/").filter((segment) => segment !== "");
const category = pathSegments[0]; // This will be 'doctors' or 'clinic' based on the URL
const nextButton = document.getElementById("nextButton");
const prevButton = document.getElementById("prevButton");

let pageNum = 1;
const itemSize = 20;
let totalRows = 0;

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
    pageNum: pageNum,
  };

  body = {
    category: category,
  };
  const responseCount = await fetch(`/dataCount`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (responseCount.status == 200) {
    let rowsJson = await responseCount.json();
    totalRows = rowsJson.rowsCount[0].count;
  }
  console.log("DATAC: ", totalRows);

  fetchData();
}

async function fetchData() {
  body = {
    data: categories[category],
    pageNum: pageNum,
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
