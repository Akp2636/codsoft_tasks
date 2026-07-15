/**
 * BoardSync - Drag-and-Drop Project Management SPA
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // INITIAL MOCK DATA CONFIG
    // ==========================================================================
    const DEFAULT_PROJECTS = [
        {
            id: "proj-boardsync-dev",
            name: "BoardSync Development",
            category: "Software Development",
            description: "Production roadmap to complete tasks, drag columns, and verify local board syncing layouts.",
            tasks: [
                {
                    id: "task-1",
                    title: "Design Kanban Board Mockups",
                    description: "Create responsive user interfaces with space slate CSS tokens, ambient glow effects, and custom pill containers.",
                    priority: "high",
                    deadline: "2026-07-20",
                    assignee: "Sarah Designer",
                    status: "completed"
                },
                {
                    id: "task-2",
                    title: "Scaffold Drag-and-drop Listeners",
                    description: "Connect HTML5 Drag-and-drop actions to columns, handle dragover highlights, and sync status properties.",
                    priority: "medium",
                    deadline: "2026-07-22",
                    assignee: "Mike Dev",
                    status: "inprogress"
                },
                {
                    id: "task-3",
                    title: "Add Task Edit Dialog Modals",
                    description: "Implement interactive modal overlays enabling addition, detail changes, and status swaps of active task cards.",
                    priority: "low",
                    deadline: "2026-07-25",
                    assignee: "Alex Morgan",
                    status: "todo"
                }
            ]
        },
        {
            id: "proj-marketing-launch",
            name: "Marketing Site Launch",
            category: "Marketing Campaign",
            description: "Prepare social media, landing pages, and domain routing for the public launch.",
            tasks: [
                {
                    id: "task-4",
                    title: "Setup DNS Domains and SSL Certificates",
                    description: "Register codsoft project domain names and configure letsencrypt SSL certificates in the web server settings.",
                    priority: "high",
                    deadline: "2026-07-16",
                    assignee: "Sys Admin",
                    status: "review"
                },
                {
                    id: "task-5",
                    title: "Write Copy for Landing Hero section",
                    description: "Draft attention-grabbing tags and value propositions for the visual digital project studios page.",
                    priority: "medium",
                    deadline: "2026-07-18",
                    assignee: "Jessica Copywriter",
                    status: "todo"
                }
            ]
        }
    ];

    // Initialize LocalStorage if empty
    if (!localStorage.getItem('boardsync_projects')) {
        localStorage.setItem('boardsync_projects', JSON.stringify(DEFAULT_PROJECTS));
    }

    // ==========================================================================
    // SYSTEM STATE
    // ==========================================================================
    let projects = JSON.parse(localStorage.getItem('boardsync_projects')) || [];
    let activeProjectId = localStorage.getItem('boardsync_active_project_id') || "";

    if (projects.length > 0 && !activeProjectId) {
        activeProjectId = projects[0].id;
        localStorage.setItem('boardsync_active_project_id', activeProjectId);
    }

    // ==========================================================================
    // SELECTION OF ELEMENTS
    // ==========================================================================
    const projectsListContainer = document.getElementById('projectsListContainer');
    const globalStatsBar = document.getElementById('globalStatsBar');
    const globalStatsLabel = document.getElementById('globalStatsLabel');
    
    const activeProjectTitle = document.getElementById('activeProjectTitle');
    const activeProjectDesc = document.getElementById('activeProjectDesc');
    const openAddTaskModalBtn = document.getElementById('openAddTaskModalBtn');
    
    // Stats Elements
    const metricTotalCount = document.getElementById('metricTotalCount');
    const metricSuccessCount = document.getElementById('metricSuccessCount');
    const metricProgressPercent = document.getElementById('metricProgressPercent');

    // Column Lists
    const columns = document.querySelectorAll('.kanban-column');
    const listTodo = document.getElementById('list-todo');
    const listInprogress = document.getElementById('list-inprogress');
    const listReview = document.getElementById('list-review');
    const listCompleted = document.getElementById('list-completed');

    // Modal Overlays
    const projectModalOverlay = document.getElementById('projectModalOverlay');
    const openAddProjectModalBtn = document.getElementById('openAddProjectModalBtn');
    const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
    const cancelProjectBtn = document.getElementById('cancelProjectBtn');
    const projectForm = document.getElementById('projectForm');

    const taskModalOverlay = document.getElementById('taskModalOverlay');
    const openAddTaskModalBtnHeader = document.getElementById('openAddTaskModalBtn');
    const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const taskForm = document.getElementById('taskForm');
    const taskModalTitle = document.getElementById('taskModalTitle');
    const submitTaskBtn = document.getElementById('submitTaskBtn');
    const editStatusGroup = document.getElementById('editStatusGroup');

    // Mobile Sidebar Elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const mobileSidebarBackdrop = document.getElementById('mobileSidebarBackdrop');

    // ==========================================================================
    // PERSISTENCE ENGINE
    // ==========================================================================
    const saveStateToStorage = () => {
        localStorage.setItem('boardsync_projects', JSON.stringify(projects));
        localStorage.setItem('boardsync_active_project_id', activeProjectId);
    };

    // ==========================================================================
    // RENDERING ELEMENTS
    // ==========================================================================
    const getActiveProject = () => {
        return projects.find(p => p.id === activeProjectId) || null;
    };

    // Build sidebar listings
    const renderSidebarProjects = () => {
        projectsListContainer.innerHTML = '';
        
        let totalWorkspaceTasks = 0;
        let totalWorkspaceCompleted = 0;

        projects.forEach(project => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            totalWorkspaceTasks += totalTasks;
            totalWorkspaceCompleted += completedTasks;

            const item = document.createElement('div');
            item.className = `project-item ${project.id === activeProjectId ? 'active' : ''}`;
            item.dataset.projId = project.id;
            
            item.innerHTML = `
                <div class="project-item-top">
                    <span class="project-item-name">${project.name}</span>
                    <button class="delete-project-btn" data-proj-id="${project.id}" title="Delete Project Board">&times;</button>
                </div>
                <div class="project-item-category">${project.category}</div>
                <div class="project-item-progress-track">
                    <div class="project-item-progress-fill" style="width: ${progress}%;"></div>
                </div>
            `;

            // Switch project select
            item.addEventListener('click', (e) => {
                // Prevent trigger click on delete button
                if (e.target.classList.contains('delete-project-btn')) return;
                
                activeProjectId = project.id;
                saveStateToStorage();
                renderSidebarProjects();
                renderKanbanBoard();
                
                // Close mobile sidebar if open
                sidebar.classList.remove('active');
                mobileSidebarBackdrop.classList.remove('active');
            });

            // Delete project
            item.querySelector('.delete-project-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete the project board: "${project.name}"?`)) {
                    projects = projects.filter(p => p.id !== project.id);
                    if (activeProjectId === project.id) {
                        activeProjectId = projects.length > 0 ? projects[0].id : "";
                    }
                    saveStateToStorage();
                    renderSidebarProjects();
                    renderKanbanBoard();
                }
            });

            projectsListContainer.appendChild(item);
        });

        // Global Workspace Load
        const globalProgress = totalWorkspaceTasks > 0 ? Math.round((totalWorkspaceCompleted / totalWorkspaceTasks) * 100) : 0;
        globalStatsBar.style.width = `${globalProgress}%`;
        globalStatsLabel.textContent = `${totalWorkspaceCompleted} of ${totalWorkspaceTasks} Tasks Completed`;
    };

    // Build Kanban elements
    const renderKanbanBoard = () => {
        const activeProj = getActiveProject();
        
        if (!activeProj) {
            // Empty state
            activeProjectTitle.textContent = "No Project Board Active";
            activeProjectDesc.textContent = "Click '+' in sidebar to start tracking tasks.";
            
            // Clear grids
            listTodo.innerHTML = '';
            listInprogress.innerHTML = '';
            listReview.innerHTML = '';
            listCompleted.innerHTML = '';

            document.getElementById('count-todo').textContent = '0';
            document.getElementById('count-inprogress').textContent = '0';
            document.getElementById('count-review').textContent = '0';
            document.getElementById('count-completed').textContent = '0';

            metricTotalCount.textContent = '0';
            metricSuccessCount.textContent = '0';
            metricProgressPercent.textContent = '0%';
            
            openAddTaskModalBtnHeader.disabled = true;
            return;
        }

        openAddTaskModalBtnHeader.disabled = false;
        activeProjectTitle.textContent = activeProj.name;
        activeProjectDesc.textContent = activeProj.description;

        // Reset columns markup
        listTodo.innerHTML = '';
        listInprogress.innerHTML = '';
        listReview.innerHTML = '';
        listCompleted.innerHTML = '';

        let counts = { todo: 0, inprogress: 0, review: 0, completed: 0 };

        activeProj.tasks.forEach(task => {
            counts[task.status]++;

            const card = document.createElement('div');
            card.className = 'task-card';
            card.setAttribute('draggable', 'true');
            card.dataset.taskId = task.id;

            // Generate initials for avatar bubble
            const initials = task.assignee
                ? task.assignee.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U';

            card.innerHTML = `
                <div class="card-tag-row">
                    <span class="priority-tag ${task.priority}">${task.priority}</span>
                    <button class="edit-task-link-btn" data-task-id="${task.id}" title="Edit Task Info">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                </div>
                <h4 class="task-card-title">${task.title}</h4>
                <p class="task-card-desc">${task.description}</p>
                <div class="card-divider"></div>
                <div class="card-footer">
                    <div class="card-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="card-date-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>${formatDateLabel(task.deadline)}</span>
                    </div>
                    <div class="card-assignee-avatar" title="Assignee: ${task.assignee}">${initials}</div>
                </div>
            `;

            // Attach edit event
            card.querySelector('.edit-task-link-btn').addEventListener('click', () => {
                openEditTaskModal(task.id);
            });

            // Attach HTML5 Drag listener events
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            // Append to correct column list
            if (task.status === 'todo') listTodo.appendChild(card);
            else if (task.status === 'inprogress') listInprogress.appendChild(card);
            else if (task.status === 'review') listReview.appendChild(card);
            else if (task.status === 'completed') listCompleted.appendChild(card);
        });

        // Set column count numeric badges
        document.getElementById('count-todo').textContent = counts.todo;
        document.getElementById('count-inprogress').textContent = counts.inprogress;
        document.getElementById('count-review').textContent = counts.review;
        document.getElementById('count-completed').textContent = counts.completed;

        // Set top dashboard metric numbers
        const totalCount = activeProj.tasks.length;
        const completionCount = counts.completed;
        const progressPercentage = totalCount > 0 ? Math.round((completionCount / totalCount) * 100) : 0;

        metricTotalCount.textContent = totalCount;
        metricSuccessCount.textContent = completionCount;
        metricProgressPercent.textContent = `${progressPercentage}%`;
    };

    const formatDateLabel = (dateStr) => {
        if (!dateStr) return '';
        const dateObj = new Date(dateStr);
        const options = { month: 'short', day: 'numeric' };
        return dateObj.toLocaleDateString('en-US', options);
    };

    // ==========================================================================
    // HTML5 DRAG AND DROP ZONE LISTENERS
    // ==========================================================================
    columns.forEach(column => {
        const dropZone = column.querySelector('.column-card-list');
        const targetStatus = column.dataset.status;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const activeProj = getActiveProject();
            
            if (activeProj) {
                const targetTask = activeProj.tasks.find(t => t.id === taskId);
                if (targetTask && targetTask.status !== targetStatus) {
                    targetTask.status = targetStatus;
                    saveStateToStorage();
                    renderSidebarProjects();
                    renderKanbanBoard();
                }
            }
        });
    });

    // ==========================================================================
    // MODALS DIALOG POPUPS MANAGEMENT
    // ==========================================================================
    
    // PROJECT MODAL
    const toggleProjectModal = (isOpen) => {
        if (isOpen) {
            projectModalOverlay.classList.add('active');
        } else {
            projectModalOverlay.classList.remove('active');
            projectForm.reset();
        }
    };

    openAddProjectModalBtn.addEventListener('click', () => toggleProjectModal(true));
    closeProjectModalBtn.addEventListener('click', () => toggleProjectModal(false));
    cancelProjectBtn.addEventListener('click', () => toggleProjectModal(false));

    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('projectName').value.trim();
        const category = document.getElementById('projectCategory').value;
        const description = document.getElementById('projectDesc').value.trim();

        const newProject = {
            id: 'proj-' + Date.now(),
            name: name,
            category: category,
            description: description,
            tasks: []
        };

        projects.push(newProject);
        activeProjectId = newProject.id;
        
        saveStateToStorage();
        renderSidebarProjects();
        renderKanbanBoard();
        toggleProjectModal(false);
    });

    // TASK MODAL
    const toggleTaskModal = (isOpen) => {
        if (isOpen) {
            taskModalOverlay.classList.add('active');
        } else {
            taskModalOverlay.classList.remove('active');
            taskForm.reset();
            document.getElementById('editTaskId').value = "";
            editStatusGroup.style.display = 'none';
        }
    };

    openAddTaskModalBtnHeader.addEventListener('click', () => {
        taskModalTitle.textContent = "Add New Task";
        submitTaskBtn.textContent = "Add Task";
        // Default deadline to 3 days out
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        document.getElementById('taskDeadline').value = defaultDate.toISOString().substring(0, 10);
        toggleTaskModal(true);
    });
    
    closeTaskModalBtn.addEventListener('click', () => toggleTaskModal(false));
    cancelTaskBtn.addEventListener('click', () => toggleTaskModal(false));

    const openEditTaskModal = (taskId) => {
        const activeProj = getActiveProject();
        if (!activeProj) return;

        const task = activeProj.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Prefill form
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDesc').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDeadline').value = task.deadline;
        document.getElementById('taskAssignee').value = task.assignee;
        
        // Show status modifying selector on editing
        document.getElementById('taskStatus').value = task.status;
        editStatusGroup.style.display = 'flex';

        taskModalTitle.textContent = "Edit Task Info";
        submitTaskBtn.textContent = "Update Task";
        
        toggleTaskModal(true);
    };

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const activeProj = getActiveProject();
        if (!activeProj) return;

        const editTaskId = document.getElementById('editTaskId').value;
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDesc').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const deadline = document.getElementById('taskDeadline').value;
        const assignee = document.getElementById('taskAssignee').value.trim();

        if (editTaskId) {
            // Action edit update
            const task = activeProj.tasks.find(t => t.id === editTaskId);
            if (task) {
                task.title = title;
                task.description = description;
                task.priority = priority;
                task.deadline = deadline;
                task.assignee = assignee;
                task.status = document.getElementById('taskStatus').value;
            }
        } else {
            // Action create push
            const newTask = {
                id: 'task-' + Date.now(),
                title: title,
                description: description,
                priority: priority,
                deadline: deadline,
                assignee: assignee,
                status: 'todo'
            };
            activeProj.tasks.push(newTask);
        }

        saveStateToStorage();
        renderSidebarProjects();
        renderKanbanBoard();
        toggleTaskModal(false);
    });

    // ==========================================================================
    // MOBILE RESPONSIVENESS DRAWER
    // ==========================================================================
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            mobileSidebarBackdrop.classList.toggle('active');
        });
    }

    if (mobileSidebarBackdrop) {
        mobileSidebarBackdrop.addEventListener('click', () => {
            sidebar.classList.remove('active');
            mobileSidebarBackdrop.classList.remove('active');
        });
    }

    // ==========================================================================
    // INITIALIZATION RUN
    // ==========================================================================
    renderSidebarProjects();
    renderKanbanBoard();
});
