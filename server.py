from flask import Flask
from flask import render_template
from flask import Response, request, jsonify
import json

app = Flask(__name__)


todo_list_data = {
    "names": [],
    "todo_items": {},
}


@app.route("/")
def hello_world():
    return render_template("to-do-list.html", todo_list_data=todo_list_data)


@app.route("/add_teammate", methods=["GET", "POST"])
def add_teammate():
    global todo_list_data

    name = request.get_json()

    todo_list_data["names"].append(name)
    todo_list_data["todo_items"][name] = {"tasks": []}

    # Send back the WHOLE array of data so the client can redisplay it
    return jsonify(
        data={
            "names": todo_list_data["names"],
            "taskObject": todo_list_data["todo_items"],
        }
    )


@app.route("/add_todo", methods=["GET", "POST"])
def add_todo():
    global todo_list_data

    json_data = request.get_json()
    name = json_data["name"]
    task_object = json_data["taskObj"]

    todo_list_data["todo_items"][name]["tasks"].append(task_object)

    # Send back the WHOLE array of data so the client can redisplay it
    return jsonify(data=todo_list_data["todo_items"])


@app.route("/task_changed", methods=["GET", "POST"])
def task_changed():
    global todo_list_data

    json_data = request.get_json()
    name = json_data["name"]
    task_text = json_data["task"]["taskText"]
    due_date = json_data["task"]["dueDate"]

    for task in todo_list_data["todo_items"][name]["tasks"]:
        if task["taskText"] == task_text and task["dueDate"] == due_date:
            task["completed"] = False if task["completed"] else True

    # Send back the WHOLE array of data so the client can redisplay it
    return jsonify(data=todo_list_data["todo_items"])


@app.route("/reset", methods=["GET", "POST"])
def reset():
    global todo_list_data

    todo_list_data["names"] = []
    todo_list_data["todo_items"] = {}

    # Send back the WHOLE array of data so the client can redisplay it
    return jsonify(
        data={
            "taskObject": todo_list_data["todo_items"],
            "names": todo_list_data["names"],
        }
    )


@app.route("/clear_completed", methods=["GET", "POST"])
def clear_completed():
    global todo_list_data

    json_data = request.get_json()
    name = json_data["name"]
    task_text = json_data["taskText"]
    due_date = json_data["dueDate"]

    for idx, task in enumerate(todo_list_data["todo_items"][name]["tasks"]):
        if task["taskText"] == task_text and task["dueDate"] == due_date:
            del todo_list_data["todo_items"][name]["tasks"][idx]
            if len(todo_list_data["todo_items"][name]["tasks"]) == 0:
                del todo_list_data["todo_items"][name]
            break

    # Send back the WHOLE array of data so the client can redisplay it
    return jsonify(data=todo_list_data["todo_items"])


@app.route("/api/todo", methods=["GET"])
def returnAllTodos():
    if request.method == "GET":
        return jsonify(todo_list_data)


@app.route("/api/todo/<id>", methods=["GET"])
def returnToDo(id):
    if request.method == "GET":
        data = todo_list_data["todo_items"].get(
            id,
            f"Index not found, must be one of {list(todo_list_data['todo_items'].keys())}",
        )
        return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)
