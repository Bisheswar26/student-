import mysql.connector


def get_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Bisheswar@12",
        database="student_expense"
    )

    return connection
