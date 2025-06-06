
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo to be deleted',
        completed: false
      })
      .returning()
      .execute();

    const input: DeleteTodoInput = {
      id: createdTodo.id
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify the todo was actually deleted from the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    const input: DeleteTodoInput = {
      id: 999999 // Non-existent ID
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const [todo1] = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        description: 'First todo',
        completed: false
      })
      .returning()
      .execute();

    const [todo2] = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        description: 'Second todo',
        completed: true
      })
      .returning()
      .execute();

    const input: DeleteTodoInput = {
      id: todo1.id
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].id).toBe(todo2.id);
    expect(remainingTodos[0].title).toBe('Todo 2');
  });
});
