from flask import Flask, request, jsonify, render_template
from database import get_connection

app = Flask(__name__)


# ================= HOME =================

@app.route("/")
def home():
    return render_template("index.html")


# ================= EXPENSE API =================

@app.route("/api/expenses", methods=["GET"])
def get_expenses():

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM expenses
        ORDER BY date DESC, id DESC
    """)

    expenses = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(expenses)


@app.route("/api/expenses", methods=["POST"])
def add_expense():

    data = request.json

    amount = data.get("amount")
    description = data.get("description")
    category = data.get("category")
    expense_type = data.get("type")
    date = data.get("date")
    payment = data.get("payment")

    if not all([
        amount,
        description,
        category,
        expense_type,
        date,
        payment
    ]):
        return jsonify({
            "error": "All fields are required"
        }), 400

    db = get_connection()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO expenses
        (
            amount,
            description,
            category,
            type,
            date,
            payment
        )
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        amount,
        description,
        category,
        expense_type,
        date,
        payment
    ))

    db.commit()

    expense_id = cursor.lastrowid

    cursor.close()
    db.close()

    return jsonify({
        "message": "Expense added successfully",
        "id": expense_id
    }), 201


# ================= DELETE EXPENSE =================

@app.route("/api/expenses/<int:id>", methods=["DELETE"])
def delete_expense(id):

    db = get_connection()
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM expenses WHERE id = %s",
        (id,)
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "message": "Expense deleted"
    })


# ================= BUDGET =================

@app.route("/api/budget", methods=["GET"])
def get_budget():

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT amount FROM budget WHERE id = 1"
    )

    budget = cursor.fetchone()

    cursor.close()
    db.close()

    if budget is None:
        return jsonify({
            "budget": 5000
        })

    return jsonify({
        "budget": float(budget["amount"])
    })


@app.route("/api/budget", methods=["PUT"])
def update_budget():

    data = request.json
    amount = data.get("amount")

    if not amount:
        return jsonify({
            "error": "Budget is required"
        }), 400

    db = get_connection()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE budget
        SET amount = %s
        WHERE id = 1
    """, (amount,))

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "message": "Budget updated",
        "budget": amount
    })


# ================= DASHBOARD =================

@app.route("/api/dashboard")
def dashboard():

    db = get_connection()
    cursor = db.cursor()

    # Budget
    cursor.execute(
        "SELECT amount FROM budget WHERE id = 1"
    )

    result = cursor.fetchone()

    if result:
        budget = float(result[0])
    else:
        budget = 5000

    # Total spent
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM expenses
    """)

    spent = float(cursor.fetchone()[0])

    # Needs
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM expenses
        WHERE type = 'need'
    """)

    needs = float(cursor.fetchone()[0])

    # Wants
    cursor.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM expenses
        WHERE type = 'want'
    """)

    wants = float(cursor.fetchone()[0])

    cursor.close()
    db.close()

    return jsonify({

        "budget": budget,

        "spent": spent,

        "remaining": max(
            0,
            budget - spent
        ),

        "needs": needs,

        "wants": wants

    })


# ================= GOALS =================

@app.route("/api/goals", methods=["GET"])
def get_goals():

    db = get_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM goals"
    )

    goals = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(goals)


@app.route("/api/goals", methods=["POST"])
def add_goal():

    data = request.json

    name = data.get("name")
    target = data.get("target")
    saved = data.get("saved", 0)

    if not name or not target:
        return jsonify({
            "error": "Goal name and target are required"
        }), 400

    db = get_connection()
    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO goals
        (
            name,
            target,
            saved
        )
        VALUES (%s, %s, %s)
    """, (
        name,
        target,
        saved
    ))

    db.commit()

    goal_id = cursor.lastrowid

    cursor.close()
    db.close()

    return jsonify({
        "message": "Goal created",
        "id": goal_id
    }), 201


@app.route("/api/goals/<int:id>", methods=["DELETE"])
def delete_goal(id):

    db = get_connection()
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM goals WHERE id = %s",
        (id,)
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "message": "Goal deleted"
    })


# ================= START =================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )
