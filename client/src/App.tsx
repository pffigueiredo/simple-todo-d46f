
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Plus, CheckCircle, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing todos
  const [editFormData, setEditFormData] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null,
    completed: false
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditFormData({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title?.trim()) return;

    setIsLoading(true);
    try {
      const updatedTodo = await trpc.updateTodo.mutate(editFormData);
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === updatedTodo.id ? updatedTodo : t))
      );
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✅ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm">
                {completedCount} of {totalCount} completed
              </Badge>
            </div>
          )}
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Todo
            </CardTitle>
            <CardDescription>
              What would you like to accomplish today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <Input
                placeholder="Enter todo title..."
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add a description (optional)..."
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Adding...' : 'Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        {todos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No todos yet!
              </h3>
              <p className="text-gray-500">
                Create your first todo above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card
                key={todo.id}
                className={`transition-all duration-200 shadow-md hover:shadow-lg ${
                  todo.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      className="mt-1 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      {todo.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div className="flex-1">
                      <h3
                        className={`text-lg font-semibold ${
                          todo.completed
                            ? 'text-green-700 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p
                          className={`mt-2 ${
                            todo.completed
                              ? 'text-green-600 line-through'
                              : 'text-gray-600'
                          }`}
                        >
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <Badge variant={todo.completed ? 'default' : 'secondary'}>
                          {todo.completed ? 'Completed' : 'Pending'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Created: {todo.created_at.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTodo(todo)}
                        className="hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Todo Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Todo</DialogTitle>
              <DialogDescription>
                Make changes to your todo here.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTodo}>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Todo title"
                  value={editFormData.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateTodoInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditFormData((prev: UpdateTodoInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={editFormData.completed}
                    onCheckedChange={(checked: boolean) =>
                      setEditFormData((prev: UpdateTodoInput) => ({ ...prev, completed: checked }))
                    }
                  />
                  <label htmlFor="completed" className="text-sm font-medium">
                    Mark as completed
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
