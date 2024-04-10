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
let searchSucc = 0;

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
  console.log("category: ", category);
  const patientAdd = document.getElementById("patient-add");
  const appAdd = document.getElementById("appt-add");
  const appDelete = document.getElementById("appt-delete");
  const appSearch = document.getElementById("appt-search");
  const appUpdate = document.getElementById("appt-update");
  const operation = document.querySelector(".operation");

  if (currOperation == "Add") {
    console.log("UNDEFINED");
    appAdd.style.display = "block";
    appDelete.style.display = "none";
    appSearch.style.display = "none";
    appUpdate.style.display = "none";
    operation.style.display = "flex";
    document.getElementById("opSelect").value = "Queued";
    setDefaultTime("StartTime");
    setDefaultTime("TimeQueued");
    setDefaultTime("EndTime");
    setDefaultDate("QueueDate");
  } else if (currOperation == "Delete") {
    console.log("HERE!");
    appAdd.style.display = "none";
    appSearch.style.display = "none";
    appUpdate.style.display = "none";
    appDelete.style.display = "block";
    operation.style.display = "flex";
  } else if (currOperation == "Update") {
    appDelete.style.display = "none";
    appAdd.style.display = "none";
    appSearch.style.display = "block";
    operation.style.display = "flex";
  } else if (currOperation == "Read") {
    appDelete.style.display = "none";
    appAdd.style.display = "none";
    operation.style.display = "none";
    appUpdate.style.display = "none";
  }
}

function setDefaultTime(timeVar) {
  // Create a new Date object to get the current time
  var now = new Date();

  // Get the current hour and minute in two-digit format (e.g., "08:30")
  var hours = now.getHours().toString().padStart(2, "0"); // Ensure two digits
  var minutes = now.getMinutes().toString().padStart(2, "0"); // Ensure two digits

  // Construct the current time string in 24-hour format (HH:mm)
  var currentTime = hours + ":" + minutes;

  // Set the value of the specified time input field to the current time
  document.getElementById(timeVar).value = currentTime;
}

function setDefaultDate(dateVar) {
  // Create a new Date object for today's date
  var today = new Date();

  // Format the date as YYYY-MM-DD
  var year = today.getFullYear();
  var month = (today.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
  var day = today.getDate().toString().padStart(2, "0"); // Day of the month

  // Create the formatted date string (YYYY-MM-DD)
  var formattedDate = `${year}-${month}-${day}`;

  // Set the value of the date input field
  document.getElementById(dateVar).value = formattedDate;
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
    totalRows = rowsJson.rows[0][0].count;
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

  const addForm = document.forms.addFormMain;
  const formData = new FormData(addForm);

  const data = {};
  for (const entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }

  // Serialize the JS object into JSON string
  const json = JSON.stringify(data);

  body = { category: category, json };

  console.log("TO STORE");
  console.log(json);

  const response = await fetch(`/postAppointment`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status == 200) {
    console.log("SUCCESS");
    const jsonMes = await response.json();
    const message = jsonMes.message;

    Swal.fire({
      position: "center",
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 1800,
    });
    addForm.reset();
    fetchNewlyAdded();
  }
}

async function deleteSubmit(event) {
  event.preventDefault();

  const deleteForm = document.forms.deleteForm;
  const formData = new FormData(deleteForm);

  const data = {};
  for (const entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }

  // Serialize the JS object into JSON string
  const json = JSON.stringify(data);

  body = { category: category, json };

  console.log("TO STORE");
  console.log(json);

  const response = await fetch(`/deleteAppointment`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status == 200) {
    console.log("SUCCESS");
    const jsonMes = await response.json();
    const message = jsonMes.message;

    Swal.fire({
      position: "center",
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 1800,
    });
    deleteForm.reset();
    onload();
  }
}

async function searchSubmit(event) {
  event.preventDefault();

  const searchForm = document.forms.searchForm;
  const formData = new FormData(searchForm);

  const data = {};
  for (const entry of formData.entries()) {
    data[entry[0]] = entry[1];
  }

  // Serialize the JS object into JSON string
  const json = JSON.stringify(data);

  body = { json: json };

  const response = await fetch(`/searchAppointment`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status == 200) {
    console.log("SUCCESS");
    const jsonMes = await response.json();
    const appointment = jsonMes.appt;
    searchSucc = 1;

    console.log(appointment[0]);

    console.log("value", document.getElementById("pxid").value);
    changeValues(appointment);
    checkPage();
    // searchForm.reset();
  }
}

function changeValues(appointment) {
  console.log("Changing values with appointment:", appointment);

  const appUpdate = document.getElementById("appt-update");
  appUpdate.style.display = "block"; // Make sure the form is visible

  // Set input values based on the retrieved appointment data
  document.getElementById("pxid").value = appointment[0].pxid;
  document.getElementById("clinicid").value = appointment[0].clinicid;
  document.getElementById("doctorid").value = appointment[0].doctorid;
  document.getElementById("opSelect").value = appointment[0].status;
  document.getElementById("TimeQueued").value = appointment[0].TimeQueued;
  document.getElementById("QueueDate").value = appointment[0].QueueDate;
  document.getElementById("StartTime").value = appointment[0].StartTime;
  document.getElementById("EndTime").value = appointment[0].EndTime;
  document.getElementById("opSelect").selectedIndex = 0;
  //   document.getElementById("virtual").value =
  //     appointment[0].Virtual === 1 ? "1" : "0";

  // Debugging: Log values after setting them
  console.log("pxid value:", document.getElementById("pxid").value);
  console.log("clinicid value:", document.getElementById("clinicid").value);
  console.log("doctorid value:", document.getElementById("doctorid").value);
  console.log("status value:", document.getElementById("opSelect").value);
  console.log("TimeQueued value:", document.getElementById("TimeQueued").value);
  console.log("QueueDate value:", document.getElementById("QueueDate").value);
  console.log("StartTime value:", document.getElementById("StartTime").value);
  console.log("EndTime value:", document.getElementById("EndTime").value);
  console.log("type value:", document.getElementById("opSelect").value);
  console.log("virtual value:", document.getElementById("virtual").value);
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
