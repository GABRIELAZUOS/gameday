import { useState, useRef } from 'react'
import { Camera, User, Eye, EyeOff } from 'lucide-react'
import type { Player } from '../../types'
import { hashPassword } from '../../lib/hash'

interface PlayerFormProps {
  initial?: Partial<Player>
  onSave: (data: { nickname: string; realName: string; photoUrl: string | null; passwordHash?: string }) => void
  onCancel: () => void
  submitLabel?: string
}

export function PlayerForm({ initial, onSave, onCancel, submitLabel = 'Criar Jogador' }: PlayerFormProps) {
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [realName, setRealName] = useState(initial?.realName ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photoUrl ?? null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = !!initial?.id
  const hasExistingPassword = !!initial?.passwordHash

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem deve ter menos de 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 256
        const ratio = Math.min(max / img.width, max / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setPhotoUrl(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) {
      setError('Apelido é obrigatório')
      return
    }
    if (password && password !== confirmPassword) {
      setError('Senhas não coincidem')
      return
    }
    if (password && password.length < 4) {
      setError('Senha deve ter pelo menos 4 caracteres')
      return
    }

    let passwordHash: string | undefined = initial?.passwordHash
    if (password) {
      passwordHash = hashPassword(password)
    } else if (!isEdit) {
      passwordHash = undefined // no password on create
    }

    onSave({ nickname: nickname.trim(), realName: realName.trim(), photoUrl, passwordHash })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer overflow-hidden bg-surface flex items-center justify-center relative group"
          onClick={() => fileRef.current?.click()}
        >
          {photoUrl ? (
            <>
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-text-dim">
              <User className="w-8 h-8" />
              <span className="text-xs">Foto</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs text-primary hover:text-primary-light transition-colors"
        >
          {photoUrl ? 'Alterar foto' : 'Adicionar foto'}
        </button>
      </div>

      {/* Nickname */}
      <div>
        <label className="label">Apelido *</label>
        <input
          className="input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Como você quer ser chamado?"
          maxLength={30}
          autoFocus
        />
      </div>

      {/* Real name */}
      <div>
        <label className="label">Nome real (opcional)</label>
        <input
          className="input"
          value={realName}
          onChange={(e) => setRealName(e.target.value)}
          placeholder="Seu nome completo"
          maxLength={50}
        />
      </div>

      {/* Password */}
      <div className="border-t border-border pt-4">
        <div className="text-xs text-text-muted mb-3">
          {isEdit
            ? hasExistingPassword
              ? '🔒 Senha configurada. Deixe em branco para manter a atual.'
              : '🔓 Sem senha. Defina abaixo para proteger o perfil (opcional).'
            : '🔒 Senha de acesso (opcional — recomendado em dispositivos compartilhados)'}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{isEdit && hasExistingPassword ? 'Nova senha' : 'Senha'}</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 4 caracteres"
                maxLength={64}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirmar senha</label>
            <input
              type={showPw ? 'text' : 'password'}
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              maxLength={64}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
