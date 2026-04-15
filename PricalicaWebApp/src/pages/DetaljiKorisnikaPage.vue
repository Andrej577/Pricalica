<template>
  <q-page class="q-pa-lg user-page">
    <div class="page-wrapper">
      <q-form v-if="!loading" class="user-form" @submit.prevent="spremiKorisnika">
        <div class="top-actions">
          <q-btn label="Povratak" outline color="primary" @click="idiNatrag" />
          <div class="text-h6 text-weight-medium page-title" data-testid="user-edit-title">
            Uređivanje korisnika
          </div>
          <div class="action-group">
            <q-btn
              color="negative"
              outline
              label="Obriši račun"
              data-testid="delete-account-button"
              @click="obrisiRacun"
            />
            <q-btn label="Spremi" color="positive" type="submit" data-testid="save-user-button" />
          </div>
        </div>

        <div class="form-grid q-mt-xl">
          <q-input v-model="korisnik.ime" outlined label="Ime" autocomplete="given-name" />

          <q-input
            v-model="korisnik.prezime"
            outlined
            label="Prezime"
            autocomplete="family-name"
          />

          <q-input
            v-model="korisnik.email"
            outlined
            type="email"
            label="E-mail"
            autocomplete="email"
          />

          <q-input
            v-model="korisnik.lozinka"
            outlined
            :type="showPassword ? 'text' : 'password'"
            label="Lozinka"
            autocomplete="new-password"
          >
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-select
            v-model="korisnik.statusRacuna"
            outlined
            emit-value
            map-options
            label="Status računa"
            :options="statusOpcije"
          />

        </div>
      </q-form>

      <div v-else class="loading-state">
        <q-spinner color="primary" size="40px" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const showPassword = ref(false)
const loading = ref(true)

const statusOpcije = [
  { label: 'Aktivan', value: 1 },
  { label: 'Neaktivan', value: 2 },
]

const korisnik = ref({
  id: null,
  ime: '',
  prezime: '',
  email: '',
  lozinka: '',
  statusRacuna: 1,
})

onMounted(() => {
  ucitajKorisnika()
})

function idiNatrag() {
  router.back()
}

async function ucitajKorisnika() {
  const korisnikId = route.params.id
  if (!korisnikId) {
    loading.value = false
    $q.notify({
      type: 'negative',
      message: 'Nedostaje ID korisnika.',
    })
    return
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/korisnici/${korisnikId}`)

    if (res.status !== 200) {
      throw new Error('Failed to fetch user')
    }

    mapirajKorisnika(res.data)
  } catch (error) {
    console.error('Failed to fetch user details', error)
      $q.notify({
        type: 'negative',
        message: 'Neuspjelo učitavanje detalja korisnika.',
      })
  } finally {
    loading.value = false
  }
}

function mapirajKorisnika(data) {
  const status = Number(data.statusRacuna_id ?? data.statusRacuna ?? 2)

  korisnik.value = {
    id: data.korisnik_id ?? data.id ?? null,
    ime: data.ime ?? '',
    prezime: data.prezime ?? '',
    email: data.email ?? '',
    lozinka: data.lozinka_hash ?? '',
    statusRacuna: status,
  }
}

async function spremiKorisnika() {
  if (!korisnik.value.id) {
    $q.notify({
      type: 'negative',
      message: 'Korisnik nije učitan pa spremanje nije moguće.',
    })
    return
  }

  try {
    const payload = { ...korisnik.value }

    const res = await axios.put(`${API_BASE_URL}/korisnici/${korisnik.value.id}`, payload)

    if (res.status !== 200) {
      throw new Error('Failed to update user')
    }

    mapirajKorisnika(res.data)

    $q.notify({
      type: 'positive',
      message: 'Podaci o korisniku su spremljeni.',
    })
  } catch (error) {
    console.error('Failed to update user', error)
    $q.notify({
      type: 'negative',
      message: 'Spremanje korisnika nije uspjelo.',
    })
  }
}

function obrisiRacun() {
  $q.dialog({
    title: 'Potvrda brisanja',
    message: 'Jeste li sigurni da želite obrisati ovaj račun?',
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Obriši',
    },
  }).onOk(async () => {
    if (!korisnik.value.id) {
      return
    }

    try {
      const res = await axios.delete(`${API_BASE_URL}/korisnici/${korisnik.value.id}`)

      if (res.status !== 200) {
        throw new Error('Failed to delete user')
      }

      $q.notify({
        type: 'warning',
        message: 'Korisnički račun je obrisan.',
      })

      router.push('/')
    } catch (error) {
      console.error('Failed to delete user', error)
      $q.notify({
        type: 'negative',
        message: 'Brisanje korisnika nije uspjelo.',
      })
    }
  })
}
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  min-height: 100%;
}

.form-grid {
  width: 100%;
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.user-page {
  min-height: 100%;
  background: #f5f5f5;
}

.user-form {
  width: 100%;
}

.top-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  flex: 1;
  text-align: center;
}

.action-group {
  display: flex;
  gap: 12px;
}

.loading-state {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 599px) {
  .top-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .page-title {
    text-align: center;
  }

  .action-group {
    width: 100%;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
