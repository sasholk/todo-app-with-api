/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable prettier/prettier */
import classNames from 'classnames';
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as api from '../../api/todos';
import { Todo } from '../../types/Todo';
import { TodoLoader } from '../TodoLoader';
import { TodoUpdateContext, TodosContext } from '../../context/TodosContext';
import { Errors } from '../../types/Errors';

interface Props {
  todoItem: Todo,
}

export const TodoItem: React.FC<Props> = ({ todoItem }) => {
  const { id, title, completed } = todoItem;
  const {
    errorMessage,
    setErrorMessage,
    setTodos,
    loadingIds,
    setLoadingIds,
  } = useContext(TodosContext);
  const {
    deleteTodo,
    toggleTodo,
  } = useContext(TodoUpdateContext);

  const [editTitle, setEditTitle] = useState(title);
  const [isEditing, setIsEditing] = useState(false);

  const titleField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleField.current?.focus();
  }, [isEditing, errorMessage]);

  const handleDelete = async () => {
    try {
      await deleteTodo(id);
    } catch (error) {
      setErrorMessage(Errors.Delete);
    }
  };

  const handleCheckbox = async () => {
    try {
      setLoadingIds(currentTodos => [...currentTodos, id]);

      const updatedTodo = { ...todoItem, completed: !completed };

      await toggleTodo(updatedTodo);
    } finally {
      setLoadingIds([]);
    }
  };

  const normalizedTitle = editTitle.trim();

  const saveEditing = async () => {
    if (!normalizedTitle) {
      deleteTodo(id);
    }

    if (normalizedTitle) {
      if (editTitle === title) {
        setIsEditing(false);
      } else {
        setLoadingIds(currentTodos => [...currentTodos, id]);

        try {
          await api.editTodo({ completed, id, title: editTitle });

          setTodos(currentTodos => currentTodos
            .map(currentTodo => (currentTodo.id === id
              ? ({ ...currentTodo, title: normalizedTitle })
              : currentTodo)));
          setIsEditing(false);
        } catch {
          setErrorMessage(Errors.Update);
        } finally {
          setLoadingIds([]);
        }
      }
    }
  };

  const handleOnEditing = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveEditing();
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(title);
    }
  };

  return (
    <div
      data-cy="Todo"
      className={
        classNames('todo', {
          completed,
        })
      }
    >
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className={classNames('todo__status', {
            completed,
          })}
          checked={completed}
          onChange={handleCheckbox}
          disabled={!!loadingIds.length}
        />
      </label>

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            data-cy="TodoTitleField"
            type="text"
            className="todo__title-field"
            placeholder="Empty todo will be deleted"
            ref={titleField}
            onBlur={saveEditing}
            value={editTitle}
            onChange={handleOnEditing}
            onKeyUp={handleKeyUp}
          />
        </form>
      ) : (
        <span
          data-cy="TodoTitle"
          className="todo__title"
          onDoubleClick={() => setIsEditing(true)}
        >
          {normalizedTitle}
        </span>
      )}
      {!isEditing && (
        <button
          type="button"
          className="todo__remove"
          data-cy="TodoDelete"
          onClick={handleDelete}
        >
          ×
        </button>
      )}

      <TodoLoader id={id} />
    </div>
  );
};
