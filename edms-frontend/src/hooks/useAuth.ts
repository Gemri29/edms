import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/auth.store'

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (res) => {
      setUser(res.data.data.user)
      navigate('/')
    },
  })
}

export function useLogout() {
  const clearUser = useAuthStore((s) => s.clearUser)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearUser()
      navigate('/login')
    },
  })
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.me()
      setUser(res.data.data.user)
      return res.data.data.user
    },
    retry: false,
  })
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: { fullName?: string; email?: string }) =>
      authApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data.data.user)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
  })
}
