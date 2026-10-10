import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import './App.css'

type User = {
  id: number
  username: string
  email: string
}

type NoteResponse = {
  message: string
  user_id: number
  text: string
}

const displayName = (username: string) =>
  username.charAt(0).toLocaleUpperCase() + username.slice(1)

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [text, setText] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await axios.get<User[]>('/api/users/')
        setUsers(response.data)
        if (response.data.length > 0) {
          setSelectedUserId(String(response.data[0].id))
        }
      } catch {
        setError('Не удалось загрузить пользователей. Попробуйте обновить страницу.')
      } finally {
        setLoadingUsers(false)
      }
    }

    void loadUsers()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSending(true)

    try {
      const response = await axios.post<NoteResponse>('/api/notes/', {
        user_id: Number(selectedUserId),
        text,
      })
      const user = users.find((item) => item.id === response.data.user_id)
      setSuccess(`${response.data.message} для ${user ? displayName(user.username) : 'пользователя'}`)
      setText('')
    } catch (requestError) {
      if (axios.isAxiosError<{ error?: string }>(requestError)) {
        setError(requestError.response?.data?.error ?? 'Не удалось отправить заметку. Попробуйте ещё раз.')
      } else {
        setError('Не удалось отправить заметку. Попробуйте ещё раз.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="page">
      <section className="note-card" aria-labelledby="page-title">
        <div className="card-mark" aria-hidden="true">N</div>
        <p className="eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</p>
        <h1 id="page-title">Новая заметка</h1>
        <p className="subtitle">Выберите получателя и сохраните то, что важно.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="user">Пользователь</label>
          <select
            id="user"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            disabled={loadingUsers || users.length === 0 || sending}
            required
          >
            {loadingUsers && <option value="">Загрузка пользователей…</option>}
            {!loadingUsers && users.length === 0 && <option value="">Нет доступных пользователей</option>}
            {users.map((user) => (
              <option key={user.id} value={user.id}>{displayName(user.username)}</option>
            ))}
          </select>

          <label htmlFor="note-text">Заметка</label>
          <textarea
            id="note-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Напишите что-нибудь важное…"
            rows={4}
            required
            disabled={sending}
          />

          <button type="submit" disabled={loadingUsers || users.length === 0 || sending || !text.trim()}>
            {sending ? 'Отправляем…' : 'Отправить заметку'}
            {!sending && <span aria-hidden="true">→</span>}
          </button>
        </form>

        {error && <p className="feedback error" role="alert">{error}</p>}
        {success && <p className="feedback success" role="status">✓ {success}</p>}
      </section>
      <p className="footer-note">Маленькие напоминания — большие дела.</p>
    </main>
  )
}

export default App
