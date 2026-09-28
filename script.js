/* =========================
   GLOBAL VARIABLES
========================= */

let selectedFile = null;
let uploadedData = [];

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const analyzeBtn = document.getElementById("analyzeBtn");


/* =========================
   SMOOTH SCROLL
========================= */

function scrollToUpload() {
    document.getElementById("upload").scrollIntoView({
        behavior: "smooth"
    });
}

function scrollToAnalytics() {
    document.getElementById("analytics").scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================
   FILE UPLOAD
========================= */

fileInput.addEventListener("change", function () {

    if (this.files.length > 0) {
        handleFile(this.files[0]);
    }

});


/* Drag & Drop */

dropZone.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropZone.style.borderColor = "#00ff9d";
    dropZone.style.background = "rgba(0,255,157,0.04)";

});


dropZone.addEventListener("dragleave", function () {

    dropZone.style.borderColor = "";
    dropZone.style.background = "";

});


dropZone.addEventListener("drop", function (event) {

    event.preventDefault();

    dropZone.style.borderColor = "";
    dropZone.style.background = "";

    const file = event.dataTransfer.files[0];

    if (file) {
        handleFile(file);
    }

});


/* =========================
   HANDLE FILE
========================= */

function handleFile(file) {

    const validExtensions = [
        ".csv",
        ".xlsx",
        ".xls"
    ];

    const extension = "." + file.name.split(".").pop().toLowerCase();

    if (!validExtensions.includes(extension)) {

        alert("Please upload CSV or Excel file.");

        return;
    }


    selectedFile = file;


    const fileInfo = document.getElementById("fileInfo");

    fileInfo.classList.remove("empty");

    fileInfo.innerHTML = `

        <i class="fa-solid fa-file-excel"></i>

        <div>

            <strong>${file.name}</strong>

            <span>
                ${(file.size / 1024).toFixed(1)} KB
            </span>

        </div>

    `;


    analyzeBtn.disabled = false;

    document.getElementById("previewStatus").textContent =
        "Dataset selected";

}


/* =========================
   READ EXCEL / CSV
========================= */

function analyzeData() {

    if (!selectedFile) {
        alert("Please upload a file first.");
        return;
    }


    analyzeBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Analyzing...
    `;

    analyzeBtn.disabled = true;


    const reader = new FileReader();


    reader.onload = function (event) {

        try {

            const data = new Uint8Array(event.target.result);

            const workbook = XLSX.read(data, {
                type: "array"
            });


            const firstSheet =
                workbook.SheetNames[0];

            const worksheet =
                workbook.Sheets[firstSheet];


            uploadedData =
                XLSX.utils.sheet_to_json(
                    worksheet,
                    {
                        defval: ""
                    }
                );


            if (uploadedData.length === 0) {

                alert("No data found in this file.");

                resetAnalyzeButton();

                return;
            }


            showPreview(uploadedData);

            updateDashboard(uploadedData);

            document.getElementById("previewStatus").textContent =
                `${uploadedData.length} records loaded`;

            analyzeBtn.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                Analysis Complete
            `;


            document.getElementById("analytics")
                .scrollIntoView({
                    behavior: "smooth"
                });


        } catch (error) {

            console.error(error);

            alert(
                "Unable to read this file. Please check the Excel/CSV format."
            );

            resetAnalyzeButton();
        }

    };


    reader.readAsArrayBuffer(selectedFile);

}


/* =========================
   SHOW DATA PREVIEW
========================= */

function showPreview(data) {

    const tbody =
        document.querySelector("#dataTable tbody");


    tbody.innerHTML = "";


    const rows =
        data.slice(0, 8);


    rows.forEach(function (row) {

        const values =
            Object.values(row);


        const tr =
            document.createElement("tr");


        let html = "";


        for (let i = 0; i < 4; i++) {

            html += `
                <td>
                    ${values[i] !== undefined
                        ? values[i]
                        : "-"}
                </td>
            `;

        }


        tr.innerHTML = html;

        tbody.appendChild(tr);

    });

}


/* =========================
   UPDATE DASHBOARD
========================= */

function updateDashboard(data) {

    document.getElementById("recordCount").textContent =
        data.length.toLocaleString();


    const revenueColumn =
        findRevenueColumn(data);


    if (revenueColumn) {

        const revenues =
            data
                .map(row => parseFloat(
                    String(row[revenueColumn])
                        .replace(/[₹,$]/g, "")
                        .replace(/,/g, "")
                ))
                .filter(value => !isNaN(value));


        if (revenues.length > 0) {

            const total =
                revenues.reduce(
                    (sum, value) => sum + value,
                    0
                );


            const average =
                total / revenues.length;


            document.getElementById("totalRevenue")
                .textContent =
                formatCurrency(total);


            document.getElementById("averageSales")
                .textContent =
                formatCurrency(average);


            updateSalesChart(revenues);

        }

    }

}


/* =========================
   FIND REVENUE COLUMN
========================= */

function findRevenueColumn(data) {

    if (!data.length) {
        return null;
    }


    const keys =
        Object.keys(data[0]);


    const possibleNames = [

        "revenue",
        "sales",
        "sale",
        "amount",
        "total",
        "price"

    ];


    return keys.find(key =>

        possibleNames.includes(
            key.toLowerCase().trim()
        )

    );

}


/* =========================
   FORMAT CURRENCY
========================= */

function formatCurrency(number) {

    if (number >= 10000000) {

        return "₹" +
            (number / 10000000)
                .toFixed(2) +
            "Cr";

    }


    if (number >= 100000) {

        return "₹" +
            (number / 100000)
                .toFixed(2) +
            "L";

    }


    if (number >= 1000) {

        return "₹" +
            (number / 1000)
                .toFixed(1) +
            "K";

    }


    return "₹" +
        Math.round(number).toLocaleString("en-IN");

}


/* =========================
   REMOVE FILE
========================= */

function removeFile() {

    selectedFile = null;

    uploadedData = [];

    fileInput.value = "";


    document.getElementById("fileInfo").innerHTML = `

        <i class="fa-solid fa-file-excel"></i>

        <div>

            <strong>No file selected</strong>

            <span>
                Upload CSV or Excel file
            </span>

        </div>

    `;


    document.getElementById("fileInfo")
        .classList.add("empty");


    analyzeBtn.disabled = true;


    analyzeBtn.innerHTML = `
        <i class="fa-solid fa-microchip"></i>
        Analyze Dataset
    `;


    document.getElementById("previewStatus").textContent =
        "Waiting for dataset...";


    document.querySelector("#dataTable tbody").innerHTML = `

        <tr>

            <td colspan="4">
                Upload a file to preview your data
            </td>

        </tr>

    `;

}


/* =========================
   RESET BUTTON
========================= */

function resetAnalyzeButton() {

    analyzeBtn.disabled = false;

    analyzeBtn.innerHTML = `
        <i class="fa-solid fa-microchip"></i>
        Analyze Dataset
    `;

}


/* =========================
   CHART
========================= */

let salesChart;


function createCharts() {

    const heroCanvas =
        document.getElementById("heroChart");


    new Chart(heroCanvas, {

        type: "line",

        data: {

            labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun"
            ],

            datasets: [{

                data: [
                    180,
                    210,
                    195,
                    280,
                    320,
                    390
                ],

                borderColor: "#00ff9d",

                backgroundColor:
                    "rgba(0,255,157,0.08)",

                fill: true,

                tension: 0.4,

                pointRadius: 0

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {

                x: {
                    display: false
                },

                y: {
                    display: false
                }

            }

        }

    });


    const salesCanvas =
        document.getElementById("salesChart");


    salesChart = new Chart(salesCanvas, {

        type: "line",

        data: {

            labels: [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec"
            ],

            datasets: [{

                label: "Sales",

                data: [
                    210,
                    240,
                    230,
                    280,
                    310,
                    295,
                    340,
                    370,
                    355,
                    410,
                    450,
                    520
                ],

                borderColor: "#00ff9d",

                backgroundColor:
                    "rgba(0,255,157,0.08)",

                fill: true,

                tension: 0.4,

                pointRadius: 3,

                pointBackgroundColor: "#00ff9d"

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                x: {
                    grid: {
                        color:
                            "rgba(255,255,255,0.04)"
                    },

                    ticks: {
                        color: "#657184"
                    }
                },

                y: {

                    grid: {
                        color:
                            "rgba(255,255,255,0.04)"
                    },

                    ticks: {
                        color: "#657184"
                    }

                }

            }

        }

    });

}


/* =========================
   UPDATE CHART
========================= */

function updateSalesChart(revenues) {

    if (!salesChart) return;


    const values =
        revenues.slice(-12);


    salesChart.data.labels =
        values.map((_, index) =>
            `Period ${index + 1}`
        );


    salesChart.data.datasets[0].data =
        values;


    salesChart.update();

}


/* =========================
   DEMO AI PREDICTION
========================= */

function runPrediction() {

    const button =
        document.querySelector(".generate-btn");


    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Generating Prediction...
    `;


    button.disabled = true;


    setTimeout(function () {

        const prediction =
            524000 +
            Math.floor(Math.random() * 40000);


        document.getElementById("forecastAmount")
            .textContent =
            formatCurrency(prediction);


        document.getElementById("predictionValue")
            .textContent =
            formatCurrency(prediction);


        document.getElementById("heroPrediction")
            .textContent =
            formatCurrency(prediction);


        button.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Prediction Generated
        `;


        button.disabled = false;


    }, 1800);

}


/* =========================
   PERIOD SELECT
========================= */

document.getElementById("periodSelect")
    .addEventListener("change", function () {

        const months =
            parseInt(this.value);


        if (!salesChart) return;


        const labels = [];

        const values = [];


        for (let i = 1; i <= months; i++) {

            labels.push(`M${i}`);

            values.push(
                Math.floor(
                    180 +
                    Math.random() * 350
                )
            );

        }


        salesChart.data.labels = labels;

        salesChart.data.datasets[0].data =
            values;

        salesChart.update();

    });


/* =========================
   INITIALIZE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        createCharts();

    }
);