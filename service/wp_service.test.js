import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LoginOutUser,
  LoginRequest,
  RegisterRequest,
  RecoverPassword,
  LoginRequestDev,
  LoginSuperUser,
} from './wp_service';

jest.mock('axios');
jest.mock('@react-native-async-storage/async-storage');

describe('LoginOutUser', () => {
  it('should remove user_token from AsyncStorage', async () => {
    await LoginOutUser();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_token');
  });
});

describe('LoginRequest', () => {
  it('should make a login request and store user_token in AsyncStorage', async () => {
    const username = 'testuser';
    const password = 'testpassword';
    const token = 'testtoken';
    const responseData = { token };

    axios.post.mockResolvedValueOnce({ data: responseData });

    const result = await LoginRequest(username, password);

    expect(axios.post).toHaveBeenCalledWith(expect.any(String), { username, password });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('user_token', token);
    expect(result).toEqual(responseData);
  });

  it('should throw an error if there is an error during the login request', async () => {
    const username = 'testuser';
    const password = 'testpassword';
    const error = new Error('Login request failed');

    axios.post.mockRejectedValueOnce(error);

    await expect(LoginRequest(username, password)).rejects.toThrow(error);
  });
});

describe('RegisterRequest', () => {
  it('should make a register request', async () => {
    const formData = { name: 'John Doe', email: 'johndoe@example.com' };
    const responseData = { success: true };

    axios.post.mockResolvedValueOnce({ data: responseData });

    const result = await RegisterRequest(formData);

    expect(axios.post).toHaveBeenCalledWith(expect.any(String), formData);
    expect(result).toEqual(responseData);
  });

  it('should throw an error if there is an error during the register request', async () => {
    const formData = { name: 'John Doe', email: 'johndoe@example.com' };
    const error = new Error('Register request failed');

    axios.post.mockRejectedValueOnce(error);

    await expect(RegisterRequest(formData)).rejects.toThrow(error);
  });
});

describe('RecoverPassword', () => {
  it('should make a recover password request', async () => {
    const email = 'johndoe@example.com';
    const responseData = { success: true };

    axios.post.mockResolvedValueOnce({ data: responseData });

    const result = await RecoverPassword(email);

    expect(axios.post).toHaveBeenCalledWith(expect.any(String), { user_login: email });
    expect(result).toEqual(responseData);
  });

  it('should throw an error if there is an error during the recover password request', async () => {
    const email = 'johndoe@example.com';
    const error = new Error('Recover password request failed');

    axios.post.mockRejectedValueOnce(error);

    await expect(RecoverPassword(email)).rejects.toThrow(error);
  });
});

describe('LoginRequestDev', () => {
  it('should make a login request to the development API', async () => {
    const username = 'testuser';
    const password = 'testpassword';
    const token = 'testtoken';
    const responseData = { token };

    axios.post.mockResolvedValueOnce({ data: responseData });

    const result = await LoginRequestDev(username, password);

    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('https://test.espacioseryhacer.com/wp-json/'), { username, password });
    expect(result).toEqual(token);
  });

  it('should throw an error if there is an error during the login request', async () => {
    const username = 'testuser';
    const password = 'testpassword';
    const error = new Error('Login request failed');

    axios.post.mockRejectedValueOnce(error);

    await expect(LoginRequestDev(username, password)).rejects.toThrow(error);
  });
});

describe('LoginSuperUser', () => {
  it('should make a request to check if the user is a super admin', async () => {
    const token = 'testtoken';
    const isSuperAdmin = true;
    const responseData = { is_super_admin: isSuperAdmin };

    axios.get.mockResolvedValueOnce({ data: responseData });

    const result = await LoginSuperUser(token);

    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('https://test.espacioseryhacer.com/wp-json/'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(result).toEqual(isSuperAdmin);
  });

  it('should throw an error if there is an error during the request', async () => {
    const token = 'testtoken';
    const error = new Error('Request failed');

    axios.get.mockRejectedValueOnce(error);

    await expect(LoginSuperUser(token)).rejects.toThrow(error);
  });
});