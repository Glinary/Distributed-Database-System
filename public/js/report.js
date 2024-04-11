let pageNum = 1;
const itemSize = 20;
let totalRows = 0;
let currOperation = "read";
let region = "central";

// Event listener for 'change' event on the select element
selectElement.addEventListener("change", (event) => {
  currOperation = event.target.value;
  console.log(currOperation);
  onload();
});

// Event listener for 'change' event on the select element
regElement.addEventListener("change", (event) => {
  region = event.target.value;
  console.log("Region: ", region);
  onload();
});

function onload() {
  checkPage();
  checkCount();
  fetchData();
}
