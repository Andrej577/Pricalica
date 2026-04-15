<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-h6 text-weight-medium">Upravljanje knjigama</div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="row q-gutter-sm justify-end">
            <q-btn
              outline
              color="primary"
              label="Uredi"
              :disable="selected.length !== 1"
              @click="otvoriUredivanje"
            />
            <q-btn
              color="negative"
              label="Izbriši"
              :disable="selected.length !== 1"
              @click="obrisiOdabranuKnjigu"
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
          no-data-label="Nema knjiga za prikaz."
          rows-per-page-label="Redova po stranici"
        />
      </q-card-section>
    </q-card>

    <q-dialog v-model="showDialog" persistent>
      <q-card class="book-dialog">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Uredi knjigu</div>
          <q-btn flat round dense icon="close" @click="zatvoriDialog" />
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="spremiKnjigu">
          <q-card-section class="q-gutter-md">
            <q-input v-model.trim="bookForm.naslov" outlined label="Naslov" />

            <q-select
              v-model="bookForm.autor_id"
              outlined
              emit-value
              map-options
              label="Autor"
              :options="autorOpcije"
            />

            <q-select
              v-model="bookForm.zanr_id"
              outlined
              emit-value
              map-options
              label="Žanr"
              :options="zanrOpcije"
            />

            <q-input
              v-model.number="bookForm.trajanje_min"
              outlined
              type="number"
              label="Trajanje (min)"
            />

            <q-select
              v-model="bookForm.statusDostupnosti_id"
              outlined
              emit-value
              map-options
              label="Status dostupnosti"
              :options="statusOpcije"
            />

            <q-input v-model.trim="bookForm.poveznica" outlined label="Poveznica" />
            <q-input
              v-model.number="bookForm.prosjecna_ocjena"
              outlined
              type="number"
              step="0.1"
              label="Prosječna ocjena"
            />
            <q-input v-model.trim="bookForm.opis" outlined type="textarea" label="Opis" />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat color="grey-8" label="Odustani" @click="zatvoriDialog" />
            <q-btn color="primary" label="Spremi" type="submit" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'

const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const editingId = ref(null)
const rows = ref([])
const selected = ref([])
const autori = ref([])
const zanrovi = ref([])

const statusOpcije = [
  { label: 'Dostupna', value: 1 },
  { label: 'Nedostupna', value: 2 },
]

const columns = [
  { name: 'naslov', label: 'Naslov', field: 'naslov', align: 'left', sortable: true },
  { name: 'autor', label: 'Autor', field: 'autorLabel', align: 'left', sortable: true },
  { name: 'zanr', label: 'Žanr', field: 'zanrLabel', align: 'left', sortable: true },
  { name: 'trajanje', label: 'Trajanje', field: 'trajanje_min', align: 'center', sortable: true },
  { name: 'status', label: 'Status', field: 'statusLabel', align: 'left', sortable: true },
  {
    name: 'prosjek',
    label: 'Prosječna ocjena',
    field: 'prosjecna_ocjena',
    align: 'center',
    sortable: true,
  },
]

const bookForm = ref(getInitialBookForm())
const selectedKnjiga = computed(() => selected.value[0] ?? null)
const autorOpcije = computed(() =>
  autori.value.map((autor) => ({
    label: `${autor.ime} ${autor.prezime}`.trim(),
    value: autor.korisnik_id,
  })),
)
const zanrOpcije = computed(() =>
  zanrovi.value.map((zanr) => ({
    label: zanr.nazivZanra ?? zanr.naziv ?? `Zanr ${zanr.zanr_id}`,
    value: zanr.zanr_id,
  })),
)

onMounted(() => {
  ucitajPodatke()
})

function getInitialBookForm() {
  return {
    naslov: '',
    autor_id: null,
    zanr_id: null,
    trajanje_min: 0,
    opis: '',
    statusDostupnosti_id: 1,
    poveznica: '',
    prosjecna_ocjena: 0,
  }
}

async function ucitajPodatke() {
  loading.value = true

  try {
    const [knjigeRes, korisniciRes, zanroviRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/knjige`),
      axios.get(`${API_BASE_URL}/korisnici`),
      axios.get(`${API_BASE_URL}/zanrovi`),
    ])

    autori.value = Array.isArray(korisniciRes.data)
      ? korisniciRes.data.filter((korisnik) => Number(korisnik.tipKorisnika_id) === 2)
      : []
    zanrovi.value = Array.isArray(zanroviRes.data) ? zanroviRes.data : []
    rows.value = Array.isArray(knjigeRes.data) ? knjigeRes.data.map(mapirajKnjigu) : []
    selected.value = []
  } catch (error) {
    console.error('Failed to fetch admin books data', error)
    $q.notify({
      type: 'negative',
      message: 'Neuspjelo učitavanje knjiga.',
    })
  } finally {
    loading.value = false
  }
}

function mapirajKnjigu(knjiga) {
  const autorId = Number(knjiga.autor_id ?? knjiga.autorId ?? 0)
  const zanrId = Number(knjiga.zanr_id ?? knjiga.zanrId ?? 0)
  const statusId = Number(knjiga.statusDostupnosti_id ?? knjiga.statusDostupnostiId ?? 1)

  return {
    id: knjiga.knjiga_id ?? knjiga.id,
    naslov: knjiga.naslov ?? '',
    autor_id: autorId,
    autorLabel: getAutorLabel(autorId),
    zanr_id: zanrId,
    zanrLabel: getZanrLabel(zanrId),
    trajanje_min: Number(knjiga.trajanje_min ?? 0),
    opis: knjiga.opis ?? '',
    statusDostupnosti_id: statusId,
    statusDostupnostiId: statusId,
    statusLabel: getStatusLabel(statusId),
    poveznica: knjiga.poveznica ?? '',
    prosjecna_ocjena: Number(knjiga.prosjecna_ocjena ?? 0),
  }
}

function getAutorLabel(autorId) {
  const autor = autori.value.find((item) => Number(item.korisnik_id) === Number(autorId))
  return autor ? `${autor.ime} ${autor.prezime}`.trim() : `Autor #${autorId}`
}

function getZanrLabel(zanrId) {
  const zanr = zanrovi.value.find((item) => Number(item.zanr_id) === Number(zanrId))
  return zanr?.nazivZanra ?? zanr?.naziv ?? `Zanr #${zanrId}`
}

function getStatusLabel(statusId) {
  return statusOpcije.find((opcija) => opcija.value === Number(statusId))?.label ?? 'Nepoznato'
}

function otvoriUredivanje() {
  if (!selectedKnjiga.value) {
    return
  }

  editingId.value = selectedKnjiga.value.id
  bookForm.value = {
    naslov: selectedKnjiga.value.naslov,
    autor_id: selectedKnjiga.value.autor_id,
    zanr_id: selectedKnjiga.value.zanr_id,
    trajanje_min: selectedKnjiga.value.trajanje_min,
    opis: selectedKnjiga.value.opis,
    statusDostupnosti_id: selectedKnjiga.value.statusDostupnosti_id,
    poveznica: selectedKnjiga.value.poveznica,
    prosjecna_ocjena: selectedKnjiga.value.prosjecna_ocjena,
  }
  showDialog.value = true
}

function zatvoriDialog() {
  showDialog.value = false
  saving.value = false
}

async function spremiKnjigu() {
  if (!bookForm.value.naslov || !bookForm.value.autor_id || !bookForm.value.zanr_id) {
    $q.notify({
      type: 'warning',
      message: 'Unesite naslov, autora i žanr.',
    })
    return
  }

  saving.value = true

  try {
    const payload = {
      ...bookForm.value,
      trajanje_min: Number(bookForm.value.trajanje_min ?? 0),
      statusDostupnosti_id: Number(bookForm.value.statusDostupnosti_id ?? 1),
      prosjecna_ocjena: Number(bookForm.value.prosjecna_ocjena ?? 0),
    }

    if (!editingId.value) {
      throw new Error('Editing book is required')
    }

    const res = await axios.put(`${API_BASE_URL}/knjige/${editingId.value}`, payload)

    if (res.status !== 200) {
      throw new Error('Failed to save book')
    }

    $q.notify({
      type: 'positive',
      message: editingId.value ? 'Knjiga je uspješno ažurirana.' : 'Knjiga je uspješno dodana.',
    })

    zatvoriDialog()
    await ucitajPodatke()
  } catch (error) {
    console.error('Failed to save book', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.error ?? 'Spremanje knjige nije uspjelo.',
    })
  } finally {
    saving.value = false
  }
}

function obrisiOdabranuKnjigu() {
  if (!selectedKnjiga.value?.id) {
    return
  }

  $q.dialog({
    title: 'Potvrda brisanja',
    message: `Želite li obrisati knjigu ${selectedKnjiga.value.naslov}?`,
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Izbriši',
    },
  }).onOk(async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/knjige/${selectedKnjiga.value.id}`)

      if (res.status !== 200) {
        throw new Error('Failed to delete book')
      }

      $q.notify({
        type: 'warning',
        message: 'Knjiga je obrisana.',
      })

      await ucitajPodatke()
    } catch (error) {
      console.error('Failed to delete book', error)
      $q.notify({
        type: 'negative',
        message: 'Brisanje knjige nije uspjelo.',
      })
    }
  })
}
</script>

<style scoped>
.book-dialog {
  width: 100%;
  max-width: 640px;
}
</style>
