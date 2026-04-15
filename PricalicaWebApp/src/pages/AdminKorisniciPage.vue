<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-h6 text-weight-medium">Upravljanje korisnicima</div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="row q-gutter-sm justify-end">
            <q-btn color="primary" label="Dodaj" @click="otvoriDodavanje" />
            <q-btn
              outline
              color="primary"
              label="Uredi"
              :disable="selected.length !== 1"
              @click="urediOdabranogKorisnika"
            />
            <q-btn
              color="negative"
              label="Izbriši"
              :disable="selected.length !== 1"
              @click="obrisiOdabranogKorisnika"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          flat
          bordered
          row-key="id"
          :rows="rows"
          :columns="columns"
          :loading="loading"
          selection="single"
          v-model:selected="selected"
          no-data-label="Nema korisnika za prikaz."
          rows-per-page-label="Redova po stranici"
        >
          <template #body-cell-aktivan="props">
            <q-td :props="props">
              <q-badge :color="props.value ? 'positive' : 'grey-6'">
                {{ props.value ? 'Da' : 'Ne' }}
              </q-badge>
            </q-td>
          </template>

        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="create-dialog">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Dodaj korisnika</div>
          <q-btn flat round dense icon="close" @click="zatvoriDodavanje" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="spremiNovogKorisnika">
          <q-card-section class="q-gutter-md">
            <q-input v-model.trim="noviKorisnik.ime" outlined label="Ime" />
            <q-input v-model.trim="noviKorisnik.prezime" outlined label="Prezime" />
            <q-input v-model.trim="noviKorisnik.email" outlined type="email" label="E-mail" />
            <q-input
              v-model="noviKorisnik.lozinka"
              outlined
              :type="showCreatePassword ? 'text' : 'password'"
              label="Lozinka"
            >
              <template #append>
                <q-icon
                  :name="showCreatePassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showCreatePassword = !showCreatePassword"
                />
              </template>
            </q-input>

            <q-select
              v-model="noviKorisnik.tipKorisnika"
              outlined
              emit-value
              map-options
              label="Tip korisnika"
              :options="tipKorisnikaOpcije"
            />

            <q-select
              v-model="noviKorisnik.statusRacuna"
              outlined
              emit-value
              map-options
              label="Status računa"
              :options="statusOpcije"
            />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat color="grey-8" label="Odustani" @click="zatvoriDodavanje" />
            <q-btn color="primary" label="Spremi" type="submit" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'

const router = useRouter()
const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const showCreatePassword = ref(false)
const rows = ref([])
const selected = ref([])

const statusOpcije = [
  { label: 'Aktivan', value: 1 },
  { label: 'Neaktivan', value: 2 },
]

const tipKorisnikaOpcije = [
  { label: 'Administrator', value: 1 },
  { label: 'Autor', value: 2 },
  { label: 'Korisnik', value: 3 },
]

const noviKorisnik = ref(getInitialNoviKorisnik())

const columns = [
  { name: 'ime', label: 'Ime', field: 'ime', align: 'left', sortable: true },
  { name: 'prezime', label: 'Prezime', field: 'prezime', align: 'left', sortable: true },
  { name: 'email', label: 'E-mail', field: 'email', align: 'left', sortable: true },
  {
    name: 'tipKorisnika',
    label: 'Tip korisnika',
    field: 'tipKorisnikaLabel',
    align: 'left',
    sortable: true,
  },
  {
    name: 'statusRacuna',
    label: 'Status računa',
    field: 'statusRacunaLabel',
    align: 'left',
    sortable: true,
  },
  { name: 'aktivan', label: 'Aktivan', field: 'aktivan', align: 'center', sortable: true },
]

const selectedKorisnik = computed(() => selected.value[0] ?? null)

onMounted(() => {
  ucitajKorisnike()
})

function getInitialNoviKorisnik() {
  return {
    ime: '',
    prezime: '',
    email: '',
    lozinka: '',
    tipKorisnika: 3,
    statusRacuna: 1,
  }
}

function mapirajKorisnika(korisnik) {
  const tipKorisnika = Number(korisnik.tipKorisnika_id ?? korisnik.tipKorisnika ?? 3)
  const statusRacuna = Number(korisnik.statusRacuna_id ?? korisnik.statusRacuna ?? 2)

  return {
    id: korisnik.korisnik_id ?? korisnik.id,
    ime: korisnik.ime ?? '',
    prezime: korisnik.prezime ?? '',
    email: korisnik.email ?? '',
    tipKorisnika,
    tipKorisnikaLabel: getTipKorisnikaLabel(tipKorisnika),
    statusRacuna,
    statusRacunaLabel: getStatusRacunaLabel(statusRacuna),
    aktivan: statusRacuna === 1,
  }
}

function getTipKorisnikaLabel(value) {
  return tipKorisnikaOpcije.find((opcija) => opcija.value === value)?.label ?? 'Nepoznato'
}

function getStatusRacunaLabel(value) {
  return statusOpcije.find((opcija) => opcija.value === value)?.label ?? 'Nepoznato'
}

async function ucitajKorisnike() {
  loading.value = true

  try {
    const res = await axios.get(`${API_BASE_URL}/korisnici`)

    if (res.status !== 200) {
      throw new Error('Failed to fetch users')
    }

    rows.value = Array.isArray(res.data)
      ? res.data
          .map(mapirajKorisnika)
          .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
      : []
    selected.value = []
  } catch (error) {
    console.error('Failed to fetch users', error)
    $q.notify({
      type: 'negative',
      message: 'Neuspjelo učitavanje korisnika.',
    })
  } finally {
    loading.value = false
  }
}

function otvoriDodavanje() {
  noviKorisnik.value = getInitialNoviKorisnik()
  showCreatePassword.value = false
  showCreateDialog.value = true
}

function zatvoriDodavanje() {
  showCreateDialog.value = false
  saving.value = false
}

async function spremiNovogKorisnika() {
  if (
    !noviKorisnik.value.ime ||
    !noviKorisnik.value.prezime ||
    !noviKorisnik.value.email ||
    !noviKorisnik.value.lozinka
  ) {
    $q.notify({
      type: 'warning',
      message: 'Unesite ime, prezime, e-mail i lozinku.',
    })
    return
  }

  saving.value = true

  try {
    const res = await axios.post(`${API_BASE_URL}/korisnici`, noviKorisnik.value)

    if (res.status !== 201) {
      throw new Error('Failed to create user')
    }

    $q.notify({
      type: 'positive',
      message: 'Korisnik je uspješno dodan.',
    })

    zatvoriDodavanje()
    await ucitajKorisnike()
  } catch (error) {
    console.error('Failed to create user', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.error ?? 'Dodavanje korisnika nije uspjelo.',
    })
  } finally {
    saving.value = false
  }
}

function urediOdabranogKorisnika() {
  if (!selectedKorisnik.value?.id) {
    return
  }

  router.push(`/profil/${selectedKorisnik.value.id}`)
}

function obrisiOdabranogKorisnika() {
  if (!selectedKorisnik.value?.id) {
    return
  }

  $q.dialog({
    title: 'Potvrda brisanja',
    message: `Želite li obrisati korisnika ${selectedKorisnik.value.ime} ${selectedKorisnik.value.prezime}?`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Izbriši',
    },
  }).onOk(async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/korisnici/${selectedKorisnik.value.id}`)

      if (res.status !== 200) {
        throw new Error('Failed to delete user')
      }


      $q.notify({
        type: 'warning',
        message: 'Korisnik je obrisan.',
      })

      await ucitajKorisnike()
    } catch (error) {
      console.error('Failed to delete user', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.error ?? 'Brisanje korisnika nije uspjelo.',
      })
    }
  })
}
</script>

<style scoped>
.create-dialog {
  width: 100%;
  max-width: 560px;
}
</style>
