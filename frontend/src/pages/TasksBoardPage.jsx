// frontend/src/pages/TasksBoardPage.jsx
import React, { useState } from 'react';
<<<<<<< HEAD
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
=======
//import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
>>>>>>> parnaz-changes
import { Card, Typography } from 'antd';
import './TasksBoardPage.css'; // فایل استایل سفارشی

const { Title, Paragraph } = Typography;

// داده‌های نمونه
const initialTasks = {
  todo: {
    name: 'برای انجام',
    items: [
      { id: 'task-1', content: 'طراحی انگشتر مدل X' },
      { id: 'task-2', content: 'تماس با مشتری برای تایید طرح' },
    ],
  },
  inProgress: {
    name: 'در حال انجام',
    items: [{ id: 'task-3', content: 'ساخت اولیه گردنبند Y' }],
  },
  done: {
    name: 'انجام شده',
    items: [{ id: 'task-4', content: 'ارسال فاکتور نهایی' }],
  },
};

const TasksBoardPage = () => {
  const [columns, setColumns] = useState(initialTasks);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // جابجایی در یک ستون
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...column, items: copiedItems },
      });
    } else {
      // جابجایی بین ستون‌ها
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
      });
    }
  };

  return (
    <div>
      <Title level={2}>برد مدیریت وظایف</Title>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {Object.entries(columns).map(([columnId, column]) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <Title level={5}>{column.name}</Title>
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="kanban-item"
                        >
                          <Card>{item.content}</Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default TasksBoardPage;