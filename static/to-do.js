const defaultDomState = document.body.innerHTML;
let teammateForm = document.querySelector('#teammateForm');
let teammateName = document.querySelector('#name');
let teammateDropdown = document.querySelector('#teammateDropdown');
let assignDefault = document.querySelector('#assignDefault');
let addMsg = document.querySelector('#addMsg');

let teammateNameList = [];
const clearCompleted = document.querySelector('#clearCompleted');
const reset = document.querySelector('#reset');
let assignMsg = document.querySelector('#assignMsg');
let assignForm = document.querySelector('#assignForm');
let taskInput = document.querySelector('#task'); 
let dateSelectInput = document.querySelector('#dateSelect');
let taskObject = {}; 

assignForm.addEventListener('submit', onAssign);
teammateForm.addEventListener('submit', onAddTeammate);
clearCompleted.addEventListener('click', onClearCompleted);
reset.addEventListener('click', onReset);

$(document).ready(function(){
    teammateNameList = data["names"] 
    taskObject = data['todo_items']
    console.log(`Before refresh: ${JSON.stringify(taskObject,null, 2)}`)
    renderSortedTaskGroups();
    console.log(`After render: ${JSON.stringify(taskObject,null, 2)}`)
    teammateNameList.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.text = name;
        teammateDropdown.appendChild(option);
        sortDropdownOptions(teammateDropdown);
        assignDefault.disabled = true;
    })
})



function onAddTeammate(e) {
    e.preventDefault();
    const newName = teammateName.value.charAt(0).toUpperCase() + teammateName.value.slice(1).toLowerCase();
    if( teammateName.value === '') {
        showMessage(addMsg, 'Please enter a name before submitting');
    }
    else if(teammateNameList.includes(newName)) {
        showMessage(addMsg, `${newName} already exists!`);
    } else {
        teammateNameList.push(newName);
        const option = document.createElement('option');
        option.value = newName;
        option.text = newName;
        teammateDropdown.appendChild(option);
        sortDropdownOptions(teammateDropdown);

        teammateName.value = '';
        assignDefault.disabled = true;
        $.ajax({
            type: "POST",
            url: "add_teammate",
            dataType : "json",
            contentType: "application/json; charset=utf-8",
            data : JSON.stringify(newName),
            success: function(result) {
                var allData = result["data"]
                data = allData
                teammateNameList = data["names"] 
                taskObject = data['taskObject']
            },
            error: function(request, status, error) {
                console.log("Error");
                console.log(request)
                console.log(status)
                console.log(error)
            }
        });
    }
}

function showMessage(msgObj, message) {
    msgObj.classList.add('msgAlert');
    msgObj.innerHTML = message;

    setTimeout(() => {
        msgObj.classList.remove('msgAlert');
        msgObj.innerHTML = '';
    }, 3000);
}

function sortDropdownOptions(dropdown) {
    const optionsArray = Array.from(dropdown.options);
    optionsArray.sort((a, b) => a.value.localeCompare(b.value));
    dropdown.innerHTML = '';
    optionsArray.forEach(option => dropdown.appendChild(option));
}


function onAssign(e) {
    e.preventDefault();
    const assignValue = teammateDropdown.value;
    const taskValue = taskInput.value;
    const dateValue = dateSelectInput.value;
    const currentDate = new Date().toISOString().split('T')[0]; 
    if( assignValue === "" || taskValue === "" || dateValue === "") {
        showMessage(assignMsg, "Must fill in values for assign, task, and date!");
    } else if(dateValue < currentDate) {
        showMessage(assignMsg, "Cannot select a date prior to today!");
    } else {
        if(!(assignValue in taskObject)) {
            taskObject[assignValue] = {
                "tasks" : []
            }
        }
        let foundDupe = false;
        taskObject[assignValue]["tasks"].forEach(task => {
            if(task.taskText === taskValue && task.dueDate === dateValue) {
                foundDupe = true;
            }
        })
        if(foundDupe) {
            showMessage(assignMsg, "Task with same text and due date already exists!");
            return;
        }
        taskObject[assignValue]["tasks"].push({
            "taskText" : taskValue,
            "dueDate": dateValue
        })


        var dataToSave = {
            "name": assignValue,
            "taskObj": {
                "completed" : false,
                "taskText": taskValue,
                "dueDate": dateValue
            }
        }

        $.ajax({
            type: "POST",
            url: "add_todo",
            dataType : "json",
            contentType: "application/json; charset=utf-8",
            data : JSON.stringify(dataToSave),
            success: function(result) {
                var allData = result["data"]
                data = allData
                taskObject = data
                renderSortedTaskGroups();
            },
            error: function(request, status, error) {
                console.log("Error");
                console.log(request)
                console.log(status)
                console.log(error)
            }
        });

        taskInput.value = '';
        dateSelectInput.value = '';   
    }
}

function renderSortedTaskGroups() {
    const container = document.querySelector('#tasksContainer');

    const placeholder = document.querySelector('.placeholderText');
    
    
    if (!(Object.keys(taskObject).length === 0)) {
        if(placeholder) {
            placeholder.remove();
        }
        container.innerHTML = '';
    }
    
    const sortedAssignValues = Object.keys(taskObject).sort((a, b) => a.localeCompare(b));

    sortedAssignValues.forEach(assignValue => {
        if( taskObject[assignValue]["tasks"].length === 0) {
            return;
        }
        taskObject[assignValue]["tasks"].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        let taskGroup = document.createElement('div');
        taskGroup.id = `task-group-${assignValue}`; 

        const subHeading = document.createElement('div');
        subHeading.classList.add('heading');
        subHeading.classList.add('sub-heading');
        subHeading.id = `sub-heading-${assignValue}`;
        subHeading.textContent = assignValue;

        taskGroup.appendChild(subHeading);

        taskObject[assignValue]["tasks"].forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task';

            const taskSpan = document.createElement('span');
            taskSpan.textContent = task.taskText;
            taskSpan.classList.add('taskText');

            const taskDetailsDiv = document.createElement('div');

            const dateSpan = document.createElement('span');
            dateSpan.textContent = `Due: ${task.dueDate}`;
            dateSpan.classList.add('dueDate');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';


            checkbox.addEventListener('change', function() {
                if (checkbox.checked) {
                    taskDiv.style.textDecoration = 'line-through';
                    taskDiv.style.color = 'lightgray';
                    taskDiv.style.opacity = '0.6'; 
                } else {
                    taskDiv.style.textDecoration = 'none';
                    taskDiv.style.color = 'black';
                    taskDiv.style.opacity = '1'; 
                }

                var dataToSave = {
                    "task": task,
                    "name": assignValue
                }
                $.ajax({
                    type: "POST",
                    url: "task_changed",
                    dataType : "json",
                    contentType: "application/json; charset=utf-8",
                    data : JSON.stringify(dataToSave),
                    success: function(result) {
                        var allData = result["data"]
                        data = allData
                        taskObject = data
                    },
                    error: function(request, status, error) {
                        console.log("Error");
                        console.log(request)
                        console.log(status)
                        console.log(error)
                    }
                });
            });

            if(task.completed){
                taskDiv.style.textDecoration = 'line-through';
                taskDiv.style.color = 'lightgray';
                taskDiv.style.opacity = '0.6'; 
                checkbox.checked = true
            } else {
                taskDiv.style.textDecoration = 'none';
                taskDiv.style.color = 'black';
                taskDiv.style.opacity = '1'; 
                checkbox.checked = false
            }

            taskDetailsDiv.appendChild(dateSpan);
            taskDetailsDiv.appendChild(checkbox);

            taskDiv.appendChild(taskSpan);
            taskDiv.appendChild(taskDetailsDiv);

            taskGroup.appendChild(taskDiv);
        });

        container.appendChild(taskGroup);
    });
}



function onReset(e) {
    const userConfirmed = confirm("Are you sure you want to reset? This will clear all tasks and revert to the initial state.");
    if(userConfirmed){
        document.body.innerHTML = defaultDomState;
        teammateNameList = [];
        taskObject = {};
        const teammateForm = document.querySelector('#teammateForm');
        teammateForm.addEventListener('submit', onAddTeammate);

        const assignForm = document.querySelector('#assignForm');
        assignForm.addEventListener('submit', onAssign);

        const clearCompleted = document.querySelector('#clearCompleted');
        clearCompleted.addEventListener('click', onClearCompleted);

        const reset = document.querySelector('#reset');
        reset.addEventListener('click', onReset);

        teammateDropdown = document.querySelector('#teammateDropdown');
        teammateName = document.querySelector('#name');
        assignDefault = document.querySelector('#assignDefault');
        addMsg = document.querySelector('#addMsg');
        assignMsg = document.querySelector('#assignMsg');
        taskInput = document.querySelector('#task');
        dateSelectInput = document.querySelector('#dateSelect');

        $.ajax({
            type: "POST",
            url: "reset",
            dataType : "json",
            contentType: "application/json; charset=utf-8",
            data : JSON.stringify({}),
            success: function(result) {
                var allData = result["data"]
                data = allData
                taskObject = data['taskObject']
                teammateNameList = data['names']
            },
            error: function(request, status, error) {
                console.log("Error");
                console.log(request)
                console.log(status)
                console.log(error)
            }
        });
    }
}


function onClearCompleted(e) {
    const container = document.querySelector('#tasksContainer');
    const completedTasks = container.querySelectorAll('.task input[type="checkbox"]:checked');

    completedTasks.forEach(checkbox => {
        const taskDiv = checkbox.closest('.task');
        if (taskDiv) {
            const taskGroup = taskDiv.closest('[id^="task-group-"]');
            const assignValue = taskGroup.id.replace('task-group-', '');
            const taskText = taskDiv.querySelector('.taskText').textContent;
            const dueDateText = taskDiv.querySelector('.dueDate').textContent.replace('Due: ', '');

            taskObject[assignValue]["tasks"] = taskObject[assignValue]["tasks"].filter(task => {
                return !(task.taskText === taskText && task.dueDate === dueDateText);
            });

            taskDiv.remove();

            var dataToSend = {
                'name': assignValue,
                'taskText' : taskText,
                'dueDate' : dueDateText
            }
            $.ajax({
                type: "POST",
                url: "clear_completed",
                dataType : "json",
                contentType: "application/json; charset=utf-8",
                data : JSON.stringify(dataToSend),
                success: function(result) {
                    var allData = result["data"]
                    data = allData
                    taskObject = data
                },
                error: function(request, status, error) {
                    console.log("Error");
                    console.log(request)
                    console.log(status)
                    console.log(error)
                }
            });
        }
    });
    console.log(`After clear: ${JSON.stringify(taskObject,null, 2)}`)
    Object.keys(taskObject).forEach(assignValue => {
        if (taskObject[assignValue]["tasks"].length === 0) {
            // delete taskObject[assignValue];
            const taskGroup = document.querySelector(`#task-group-${assignValue}`);
            if (taskGroup) {
                taskGroup.remove();
            }
        }
    });

    if (Object.keys(taskObject).length === 0) {
        container.innerHTML = '<div class="placeholderText">No tasks right now. Please add a teammate and assign a task.</div>';
    }

}

