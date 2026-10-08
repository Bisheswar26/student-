```javascript
// ==========================================
// SPENDWISE - MYSQL VERSION
// ==========================================

let budget = 5000;
let expenses = [];
let goals = [];

const icons = {
    Food: "🍔",
    Travel: "🚌",
    Education: "📚",
    Shopping: "🛍️",
    Entertainment: "🎮",
    Other: "📦"
};


// ================= DATE =================

function getDate(days = 0) {
    let date = new Date();
    date.setDate(date.getDate() + days);

    return date.toISOString().split("T")[0];
}


function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// ================= MONEY =================

function money(number) {
    return "₹" + Number(number || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    });
}


// ================= LOAD DATA FROM MYSQL =================

async function loadData() {

    try {

        // Expenses
        let expenseResponse =
            await fetch("/api/expenses");

        if (!expenseResponse.ok) {
            throw new Error("Could not load expenses");
        }

        expenses =
            await expenseResponse.json();


        // Budget
        let budgetResponse =
            await fetch("/api/budget");

        if (!budgetResponse.ok) {
            throw new Error("Could not load budget");
        }

        let budgetData =
            await budgetResponse.json();

        budget =
            Number(budgetData.budget);


        // Goals
        let goalResponse =
            await fetch("/api/goals");

        if (!goalResponse.ok) {
            throw new Error("Could not load goals");
        }

        goals =
            await goalResponse.json();


        updateDashboard();
        updateSmartTip();

        console.log("Data loaded from MySQL");

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not connect to the database. Check Flask and MySQL."
        );

    }
}


// ================= NAVIGATION =================

function showPage(page) {

    document.querySelectorAll(".page")
        .forEach(section => {
            section.classList.remove("active");
        });


    document
        .getElementById(page)
        .classList.add("active");


    document.querySelectorAll(".nav-btn")
        .forEach(button => {
            button.classList.remove("active");
        });


    document.querySelectorAll(".nav-btn")
        .forEach(button => {

            let text =
                button.innerText.toLowerCase();

            if (
                (page === "dashboard" &&
                    text.includes("dashboard")) ||

                (page === "expenses" &&
                    text.includes("expenses")) ||

                (page === "analytics" &&
                    text.includes("analytics")) ||

                (page === "goals" &&
                    text.includes("savings"))
            ) {
                button.classList.add("active");
            }

        });


    if (page === "analytics") {
        drawCharts();
    }
}


// ================= EXPENSE MODAL =================

function openExpenseModal() {

    document
        .getElementById("expenseModal")
        .classList.add("show");

    document
        .getElementById("date")
        .value = getDate();
}


function closeExpenseModal() {

    document
        .getElementById("expenseModal")
        .classList.remove("show");
}


// ================= ADD EXPENSE =================

async function addExpense(event) {

    event.preventDefault();


    let amount =
        Number(
            document.getElementById("amount").value
        );


    let description =
        document.getElementById("description").value;


    let category =
        document.getElementById("category").value;


    let type =
        document.getElementById("type").value;


    let date =
        document.getElementById("date").value;


    let payment =
        document.getElementById("payment").value;


    try {

        let response =
            await fetch("/api/expenses", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    amount: amount,
                    description: description,
                    category: category,
                    type: type,
                    date: date,
                    payment: payment

                })

            });


        let result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Failed to add expense"
            );

        }


        closeExpenseModal();


        document
            .querySelector("#expenseModal form")
            .reset();


        await loadData();


        alert("Expense saved to MySQL successfully!");

    }

    catch (error) {

        console.error(error);

        alert(
            "Error saving expense: " +
            error.message
        );

    }
}


// ================= TOTAL =================

function totalSpent() {

    return expenses.reduce(
        (total, expense) =>
            total + Number(expense.amount),
        0
    );
}


// ================= DASHBOARD =================

function updateDashboard() {

    let spent =
        totalSpent();


    let remaining =
        budget - spent;


    let percent =
        budget > 0
            ? (spent / budget) * 100
            : 0;


    document
        .getElementById("budgetAmount")
        .innerText = money(budget);


    document
        .getElementById("spentAmount")
        .innerText = money(spent);


    document
        .getElementById("remainingAmount")
        .innerText =
            money(Math.max(0, remaining));


    let daily =
        spent /
        Math.max(1, new Date().getDate());


    document
        .getElementById("dailyAverage")
        .innerText =
            money(daily);


    document
        .getElementById("budgetPercent")
        .innerText =
            Math.round(percent) + "%";


    document
        .getElementById("progressBar")
        .style.width =
            Math.min(percent, 100) + "%";


    document
        .getElementById("budgetSpent")
        .innerText =
            money(spent);


    document
        .getElementById("budgetTotal")
        .innerText =
            money(budget);


    let warning =
        document.getElementById("budgetWarning");


    if (percent >= 100) {

        warning.innerHTML =
            `<div class="warning">
                ⚠️ You have exceeded your budget.
            </div>`;

    }

    else if (percent >= 80) {

        warning.innerHTML =
            `<div class="warning">
                ⚠️ You have used more than 80% of your budget.
            </div>`;

    }

    else {

        warning.innerHTML = "";

    }


    updateNeedWant();
    updateCategories();
    updateRecent();
    displayExpenses();
    updateGoals();
    updateAnalytics();
}


// ================= NEED VS WANT =================

function updateNeedWant() {

    let needs = 0;
    let wants = 0;


    expenses.forEach(expense => {

        if (expense.type === "need") {

            needs += Number(expense.amount);

        }

        else {

            wants += Number(expense.amount);

        }

    });


    let total =
        needs + wants;


    let needPercent =
        total > 0
            ? (needs / total) * 100
            : 0;


    document
        .getElementById("needAmount")
        .innerText =
            money(needs);


    document
        .getElementById("wantAmount")
        .innerText =
            money(wants);


    document
        .getElementById("needPercent")
        .innerText =
            Math.round(needPercent) + "%";


    document
        .getElementById("donut")
        .style.background =
            `conic-gradient(
                #6655dd 0 ${needPercent}%,
                #e6b14a ${needPercent}% 100%
            )`;
}


// ================= CATEGORY =================

function updateCategories() {

    let totals = {};


    expenses.forEach(expense => {

        if (!totals[expense.category]) {
            totals[expense.category] = 0;
        }

        totals[expense.category] +=
            Number(expense.amount);

    });


    let values =
        Object.entries(totals)
            .sort((a, b) => b[1] - a[1]);


    let max =
        values.length
            ? values[0][1]
            : 1;


    let html = "";


    values.forEach(([category, amount]) => {

        let width =
            (amount / max) * 100;


        html += `
            <div class="category-row">

                <div class="category-label">

                    <span>
                        ${icons[category] || "📦"}
                        ${category}
                    </span>

                    <b>
                        ${money(amount)}
                    </b>

                </div>

                <div class="category-bar">

                    <div
                        class="category-fill"
                        style="width:${width}%">
                    </div>

                </div>

            </div>
        `;

    });


    document
        .getElementById("categoryList")
        .innerHTML =
            html ||
            "<p>No expenses yet.</p>";
}


// ================= RECENT =================

function updateRecent() {

    let recent =
        [...expenses]
            .sort((a, b) =>
                b.date.localeCompare(a.date)
            )
            .slice(0, 5);


    let html = "";


    recent.forEach(expense => {

        html += `
            <div class="expense-row">

                <div class="expense-icon">
                    ${icons[expense.category] || "📦"}
                </div>

                <div class="expense-info">

                    <b>
                        ${expense.description}
                    </b>

                    <small>
                        ${expense.category}
                        •
                        ${formatDate(expense.date)}
                    </small>

                </div>

                <div class="expense-money">
                    ${money(expense.amount)}
                </div>

            </div>
        `;

    });


    document
        .getElementById("recentExpenses")
        .innerHTML =
            html ||
            "<p>No expenses yet.</p>";
}


// ================= EXPENSE TABLE =================

function displayExpenses() {

    let searchElement =
        document.getElementById("search");

    let categoryElement =
        document.getElementById("categoryFilter");

    let typeElement =
        document.getElementById("typeFilter");


    if (!searchElement) return;


    let search =
        searchElement.value.toLowerCase();


    let category =
        categoryElement.value;


    let type =
        typeElement.value;


    let filtered =
        expenses.filter(expense => {

            let matchesSearch =
                String(expense.description)
                    .toLowerCase()
                    .includes(search);


            let matchesCategory =
                category === "all" ||
                expense.category === category;


            let matchesType =
                type === "all" ||
                expense.type === type;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesType
            );

        });


    let html = "";


    filtered
        .sort((a, b) =>
            b.date.localeCompare(a.date)
        )
        .forEach(expense => {

            html += `
                <tr>

                    <td>
                        ${icons[expense.category] || "📦"}
                        <b>
                            ${expense.description}
                        </b>
                    </td>

                    <td>
                        ${expense.category}
                    </td>

                    <td>
                        <span class="tag ${expense.type}">
                            ${expense.type}
                        </span>
                    </td>

                    <td>
                        ${formatDate(expense.date)}
                    </td>

                    <td>
                        <b>
                            ${money(expense.amount)}
                        </b>
                    </td>

                    <td>
                        <button
                            class="delete-btn"
                            onclick="deleteExpense(${expense.id})">
                            Delete
                        </button>
                    </td>

                </tr>
            `;

        });


    document
        .getElementById("expenseTable")
        .innerHTML =
            html ||
            `
                <tr>
                    <td colspan="6"
                        style="text-align:center">
                        No expenses found.
                    </td>
                </tr>
            `;
}


// ================= DELETE EXPENSE =================

async function deleteExpense(id) {

    if (!confirm("Are you sure you want to delete this expense?")) {
        return;
    }


    try {

        let response =
            await fetch(
                `/api/expenses/${id}`,
                {
                    method: "DELETE"
                }
            );


        let result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Delete failed"
            );

        }


        await loadData();


        alert("Expense deleted successfully.");

    }

    catch (error) {

        console.error(error);

        alert(
            "Error deleting expense: " +
            error.message
        );

    }
}


// ================= BUDGET =================

function editBudget() {

    document
        .getElementById("newBudget")
        .value = budget;


    document
        .getElementById("budgetModal")
        .classList.add("show");
}


function closeBudgetModal() {

    document
        .getElementById("budgetModal")
        .classList.remove("show");
}


async function saveBudget(event) {

    event.preventDefault();


    let newBudget =
        Number(
            document
                .getElementById("newBudget")
                .value
        );


    try {

        let response =
            await fetch(
                "/api/budget",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        amount: newBudget
                    })
                }
            );


        let result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Budget update failed"
            );

        }


        closeBudgetModal();

        await loadData();

        alert("Budget saved to MySQL.");

    }

    catch (error) {

        console.error(error);

        alert(
            "Error saving budget: " +
            error.message
        );

    }
}


// ================= GOALS =================

function openGoalModal() {

    document
        .getElementById("goalModal")
        .classList.add("show");
}


function closeGoalModal() {

    document
        .getElementById("goalModal")
        .classList.remove("show");
}


async function addGoal(event) {

    event.preventDefault();


    let name =
        document
            .getElementById("goalName")
            .value;


    let target =
        Number(
            document
                .getElementById("goalTarget")
                .value
        );


    let saved =
        Number(
            document
                .getElementById("goalSaved")
                .value
        );


    try {

        let response =
            await fetch(
                "/api/goals",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name: name,
                        target: target,
                        saved: saved

                    })
                }
            );


        let result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Goal creation failed"
            );

        }


        closeGoalModal();


        document
            .querySelector("#goalModal form")
            .reset();


        await loadData();


        alert("Goal saved to MySQL.");

    }

    catch (error) {

        console.error(error);

        alert(
            "Error saving goal: " +
            error.message
        );

    }
}


function updateGoals() {

    let html = "";


    goals.forEach(goal => {

        let percent =
            Number(goal.target) > 0
                ? (Number(goal.saved) /
                    Number(goal.target)) * 100
                : 0;


        percent =
            Math.min(100, percent);


        html += `
            <div class="goal">

                <div class="goal-top">

                    <span class="goal-icon">
                        🎯
                    </span>

                    <button
                        class="delete-btn"
                        onclick="deleteGoal(${goal.id})">
                        Delete
                    </button>

                </div>

                <h3>
                    ${goal.name}
                </h3>

                <p>

                    <b>
                        ${money(goal.saved)}
                    </b>

                    saved of

                    ${money(goal.target)}

                </p>

                <div class="goal-progress">

                    <div
                        style="width:${percent}%">
                    </div>

                </div>

                <div class="goal-footer">

                    <span>
                        ${Math.round(percent)}%
                        complete
                    </span>

                    <span>
                        ${money(
                            Math.max(
                                0,
                                Number(goal.target) -
                                Number(goal.saved)
                            )
                        )}
                        left
                    </span>

                </div>

            </div>
        `;

    });


    document
        .getElementById("goalsContainer")
        .innerHTML =
            html ||
            "<div class='card'>No savings goals yet.</div>";
}


async function deleteGoal(id) {

    if (!confirm("Delete this goal?")) {
        return;
    }


    try {

        let response =
            await fetch(
                `/api/goals/${id}`,
                {
                    method: "DELETE"
                }
            );


        let result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error || "Delete failed"
            );

        }


        await loadData();

    }

    catch (error) {

        console.error(error);

        alert(
            "Error deleting goal: " +
            error.message
        );

    }
}


// ================= ANALYTICS =================

function updateAnalytics() {

    let totals = {};


    expenses.forEach(expense => {

        totals[expense.category] =
            (totals[expense.category] || 0) +
            Number(expense.amount);

    });


    let categories =
        Object.entries(totals)
            .sort((a, b) => b[1] - a[1]);


    if (categories.length) {

        document
            .getElementById("highestCategory")
            .innerText =
                categories[0][0] +
                " — " +
                money(categories[0][1]);

    }

    else {

        document
            .getElementById("highestCategory")
            .innerText =
                "No expenses yet";

    }


    let wants =
        expenses
            .filter(expense =>
                expense.type === "want"
            )
            .reduce(
                (sum, expense) =>
                    sum + Number(expense.amount),
                0
            );


    document
        .getElementById("potentialSavings")
        .innerText =
            money(wants * 0.25) +
            " possible savings";


    let average =
        expenses.length
            ? totalSpent() / expenses.length
            : 0;


    document
        .getElementById("averageExpense")
        .innerText =
            money(average);
}


// ================= CHARTS =================

function drawCharts() {

    drawCategoryChart();
    drawWeeklyChart();

}


function drawCategoryChart() {

    let canvas =
        document.getElementById("categoryChart");


    if (!canvas) return;


    let ctx =
        canvas.getContext("2d");


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    let totals = {};


    expenses.forEach(expense => {

        totals[expense.category] =
            (totals[expense.category] || 0) +
            Number(expense.amount);

    });


    let data =
        Object.entries(totals);


    let total =
        data.reduce(
            (sum, item) =>
                sum + item[1],
            0
        );


    if (!total) {

        ctx.font = "16px Arial";

        ctx.fillText(
            "No data yet",
            180,
            150
        );

        return;
    }


    let colors = [
        "#6856df",
        "#3181dc",
        "#20a36a",
        "#e6a438",
        "#d65c8a",
        "#55a7a0"
    ];


    let start = 0;


    data.forEach(([category, value], index) => {

        let angle =
            (value / total) *
            Math.PI *
            2;


        ctx.beginPath();

        ctx.moveTo(150, 150);

        ctx.arc(
            150,
            150,
            100,
            start,
            start + angle
        );

        ctx.closePath();


        ctx.fillStyle =
            colors[index % colors.length];

        ctx.fill();


        start += angle;

    });


    ctx.fillStyle = "white";

    ctx.beginPath();

    ctx.arc(
        150,
        150,
        55,
        0,
        Math.PI * 2
    );

    ctx.fill();


    data.forEach(([category, value], index) => {

        let y =
            35 + index * 35;


        ctx.fillStyle =
            colors[index % colors.length];


        ctx.fillRect(
            320,
            y - 8,
            10,
            10
        );


        ctx.fillStyle = "#444";

        ctx.font = "12px Arial";


        ctx.fillText(
            category,
            340,
            y
        );


        ctx.fillStyle = "#888";


        ctx.fillText(
            money(value),
            420,
            y
        );

    });
}


function drawWeeklyChart() {

    let canvas =
        document.getElementById("weeklyChart");


    if (!canvas) return;


    let ctx =
        canvas.getContext("2d");


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    let data = [];


    for (let i = 6; i >= 0; i--) {

        let date =
            getDate(-i);


        let amount =
            expenses
                .filter(expense =>
                    expense.date === date
                )
                .reduce(
                    (sum, expense) =>
                        sum +
                        Number(expense.amount),
                    0
                );


        data.push({
            date: date,
            amount: amount
        });

    }


    let max =
        Math.max(
            ...data.map(item => item.amount),
            100
        );


    ctx.strokeStyle = "#dddddd";

    ctx.beginPath();

    ctx.moveTo(40, 250);

    ctx.lineTo(480, 250);

    ctx.stroke();


    ctx.strokeStyle = "#6856df";

    ctx.lineWidth = 3;

    ctx.beginPath();


    data.forEach((item, index) => {

        let x =
            45 + index * 70;


        let y =
            250 -
            (item.amount / max) * 200;


        if (index === 0) {
            ctx.moveTo(x, y);
        }

        else {
            ctx.lineTo(x, y);
        }

    });


    ctx.stroke();


    data.forEach((item, index) => {

        let x =
            45 + index * 70;


        let y =
            250 -
            (item.amount / max) * 200;


        ctx.fillStyle = "#6856df";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.fillStyle = "#777";

        ctx.font = "10px Arial";


        ctx.fillText(
            item.date.substring(5),
            x - 12,
            270
        );

    });
}


// ================= SMART TIP =================

function updateSmartTip() {

    let spent =
        totalSpent();


    if (spent > budget * 0.8) {

        document
            .getElementById("smartTip")
            .innerText =
                "Your spending is close to the budget. Review unnecessary wants.";

    }

    else {

        document
            .getElementById("smartTip")
            .innerText =
                "Track every small expense. Small amounts add up.";

    }
}


// ================= START =================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        document
            .getElementById("date")
            .value = getDate();

        loadData();

    }
);
```
