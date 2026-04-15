<template>
  <q-page class="auth-page flex flex-center q-pa-md">
    <q-card flat class="auth-card">
      <q-card-section class="q-pb-none">
        <div class="text-h5 text-weight-medium">Dobrodošli natrag</div>
      </q-card-section>

      <q-card-section>
        <q-form class="auth-form" data-testid="login-form" @submit.prevent="submitLogin">
          <q-input
            v-model.trim="loginForm.email"
            outlined
            type="email"
            label="E-mail"
            autocomplete="email"
            data-testid="login-email-input"
            lazy-rules
            :rules="[(val) => !!val || 'Unesite e-mail']"
          >
            <template #prepend>
              <q-icon name="mail" />
            </template>
          </q-input>

          <q-input
            v-model="loginForm.lozinka"
            outlined
            :type="showLoginPassword ? 'text' : 'password'"
            label="Lozinka"
            autocomplete="current-password"
            data-testid="login-password-input"
            lazy-rules
            :rules="[(val) => !!val || 'Unesite lozinku']"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>

            <template #append>
              <q-icon
                :name="showLoginPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showLoginPassword = !showLoginPassword"
              />
            </template>
          </q-input>

          <q-btn
            label="Prijavi se"
            color="primary"
            type="submit"
            class="full-width"
            data-testid="login-button"
            :loading="submittingLogin"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from 'src/config/api'
import { clearCurrentUserRole, setCurrentUserId, setCurrentUserRole } from 'src/composables/auth'

const ADMIN_EMAIL = 'maja.peric@example.com'

const router = useRouter()
const $q = useQuasar()

const showLoginPassword = ref(false)
const submittingLogin = ref(false)

const loginForm = reactive({
  email: '',
  lozinka: '',
})

function resetForm() {
  clearCurrentUserRole()
  loginForm.email = ''
  loginForm.lozinka = ''
}

function resolveUserRole(responseRole, email) {
  if (responseRole === 'admin' || responseRole === 'user') {
    return responseRole
  }

  return email.trim().toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'
}

async function submitLogin() {
  if (!loginForm.email || !loginForm.lozinka) {
    $q.notify({
      type: 'warning',
      message: 'Unesite e-mail i lozinku.',
    })
    return
  }

  submittingLogin.value = true

  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email: loginForm.email,
      lozinka: loginForm.lozinka,
    })

    const resolvedRole = resolveUserRole(response.data?.uloga, loginForm.email)
    const targetRoute = resolvedRole === 'admin' ? '/admin/korisnici' : '/pocetna'

    setCurrentUserRole(resolvedRole)
    setCurrentUserId(response.data?.korisnik_id ?? '')

    $q.notify({
      type: 'positive',
      message: 'Prijava uspješna.',
    })

    await router.push(targetRoute)
  } catch (error) {
    const message = error.response?.data?.error ?? 'Prijava nije uspjela.'

    $q.notify({
      type: 'negative',
      message,
    })
  } finally {
    submittingLogin.value = false
  }
}

resetForm()
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(38, 90, 142, 0.18), transparent 34%),
    linear-gradient(135deg, #f7efe4 0%, #f3f6fb 48%, #e5eef5 100%);
}

.auth-card {
  width: min(100%, 460px);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 60px rgba(23, 50, 77, 0.15);
  overflow: hidden;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
