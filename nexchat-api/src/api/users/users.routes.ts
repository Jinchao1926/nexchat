import { Hono } from 'hono';

import { serializeUser, serializeUsers } from './users.presenter';
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
  UserNotFoundError,
  UsernameTakenError,
} from './users.service';
import {
  createUserValidator,
  updateUserValidator,
  userIdParamValidator,
} from './users.validators';

const app = new Hono();

app.get('/', async (c) => {
  const users = listUsers();
  return c.json({ message: 'ok', users: serializeUsers(users) });
});

app.get('/:id', userIdParamValidator, async (c) => {
  const { id } = c.req.valid('param');

  try {
    const user = getUserById(id);
    return c.json({ message: 'ok', user: serializeUser(user) });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return c.json({ message: error.message }, 404);
    }

    throw error;
  }
});

app.post('/', createUserValidator, async (c) => {
  const data = c.req.valid('json');

  try {
    const user = await createUser(data);
    return c.json({ message: 'ok', user: serializeUser(user) }, 201);
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return c.json({ message: error.message }, 409);
    }

    throw error;
  }
});

app.patch('/:id', userIdParamValidator, updateUserValidator, async (c) => {
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  try {
    const user = await updateUser(id, data);
    return c.json({ message: 'ok', user: serializeUser(user) });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return c.json({ message: error.message }, 404);
    }

    if (error instanceof UsernameTakenError) {
      return c.json({ message: error.message }, 409);
    }

    throw error;
  }
});

app.delete('/:id', userIdParamValidator, async (c) => {
  const { id } = c.req.valid('param');

  try {
    await deleteUser(id);
    return c.json({ message: 'ok' });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return c.json({ message: error.message }, 404);
    }

    throw error;
  }
});

export default app;
