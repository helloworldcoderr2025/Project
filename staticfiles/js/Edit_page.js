function display_table(){
    const selected_table = document.getElementById("table_name").value;
    if(!selected_table) return;
    fetch(`view_selected_table/?table_name=${selected_table}`)
        .then(response => response.text())
        .then(data => {
            document.getElementById("preview_table").innerHTML = data;
        })
        .catch(error => {
            document.getElementById("preview_table").innerHTML = "<p>Table can't be loaded</p>";
        })
}

function display_uploaded_table() {
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];
  const previewDiv = document.getElementById("preview_uploaded_table");

  previewDiv.innerHTML = ""; // Clear existing preview

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Convert to HTML table (first 10 rows max)
    let html = "<table border='1'><thead><tr>";

    const maxRows = 10;
    const headers = jsonData[0] || [];
    html += headers.map(h => `<th>${h}</th>`).join("");
    html += "</tr></thead><tbody>";

    for (let i = 1; i < Math.min(jsonData.length, maxRows); i++) {
      html += "<tr>";
      html += (jsonData[i] || []).map(cell => `<td>${cell ?? ""}</td>`).join("");
      html += "</tr>";
    }

    html += "</tbody></table>";
    previewDiv.innerHTML = html;
  };

  reader.readAsArrayBuffer(file);
}
