const pathname = window.location.pathname;
const pathSegments = pathname.split("/").filter((segment) => segment !== "");
const category = pathSegments[0]; // This will be 'doctors' or 'clinic' based on the URL
const nextButton = document.getElementById("nextButton");
const prevButton = document.getElementById("prevButton");
const selectElement = document.getElementById("opSelect");

let pageNum = 1;
const itemSize = 20;
let totalRows = 0;
let currOperation = "read";

categories = {
  doctors: "alldoctors",
  clinics: "allclinic",
  patients: "allpatients",
  undefined: "alldata",
};

onload(category);

async function onload() {
  console.log("onload...");

  checkPage();
  checkCount();
  fetchData();
}

function checkPage() {
  const patientAdd = document.getElementById("patient-add");
  const operation = document.querySelector(".operation");

  if (category == "patients" && currOperation == "Add") {
    patientAdd.style.display = "block";
    operation.style.display = "flex";
  }
}

async function checkCount() {
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

async function addSubmit(event) {
  event.preventDefault();

  const addForm = document.forms.addForm;
  const formData = new FormData(addForm);

  const data = {};
  for (const entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }

  // Serialize the JS object into JSON string
  const json = JSON.stringify(data);

  body = { category: category, json };

  const response = await fetch(`/addtodb`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status == 200) {
    const jsonMes = await response.json();
    const message = jsonMes.message;
    Swal.fire({
      position: "center",
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 1500,
    });
    addForm.reset();
    fetchNewlyAdded();
  }
}

async function fetchNewlyAdded() {
  body = {
    data: categories[category],
    pageNum: pageNum,
  };

  const response = await fetch(`/allNewData`, {
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

// Event listener for 'change' event on the select element
selectElement.addEventListener("change", (event) => {
  currOperation = event.target.value;
  console.log(currOperation);
  onload();
});

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
