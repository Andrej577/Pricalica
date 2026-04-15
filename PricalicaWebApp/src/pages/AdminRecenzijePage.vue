<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-h6 text-weight-medium">Upravljanje recenzijama</div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="row q-gutter-sm justify-end">
            <q-btn color="primary" label="Dodaj" @click="otvoriDodavanje" />
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
              @click="obrisiOdabranuRecenziju"
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
          no-data-label="Nema recenzija za prikaz."
          rows-per-page-label="Redova po stranici"
        />
      </q-card-section>
    </q-card>

    <review-dialog
      v-model="showDialog"
      :books="bookOptions"
      :users="userOptions"
      :initial-review="dialogReview"
      :show-user-select="true"
      :show-favorite="true"
      @save="spremiRecenziju"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'
import ReviewDialog from 'src/pages/RecenzijaDialogPage.vue'

const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const editingId = ref(null)
const rows = ref([])
const selected = ref([])
const korisnici = ref([])
const knjige = ref([])

const columns = [
  { name: 'korisnik', label: 'Korisnik', field: 'korisnikLabel', align: 'left', sortable: true },
  { name: 'knjiga', label: 'Knjiga', field: 'knjigaLabel', align: 'left', sortable: true },
  { name: 'ocjena', label: 'Ocjena', field: 'ocjena', align: 'center', sortable: true },
  { name: 'recenzija', label: 'Recenzija', field: 'recenzija', align: 'left', sortable: true },
  { name: 'omiljena', label: 'Omiljena', field: 'omiljenaLabel', align: 'left', sortable: true },
]

const selectedRecenzija = computed(() => selected.value[0] ?? null)
const userOptions = computed(() =>
  korisnici.value.map((korisnik) => ({
    id: korisnik.korisnik_id,
    ime: korisnik.ime,
    prezime: korisnik.prezime,
  })),
)
const bookOptions = computed(() =>
  knjige.value.map((knjiga) => ({
    id: knjiga.knjiga_id,
    naslov: knjiga.naslov,
  })),
)
const dialogReview = computed(() => {
  if (!selectedRecenzija.value || !editingId.value) {
    return null
  }

  return {
    korisnikId: selectedRecenzija.value.korisnik_id,
    knjigaId: selectedRecenzija.value.knjiga_id,
    ocjena: selectedRecenzija.value.ocjena,
    tekst: selectedRecenzija.value.recenzija,
    omiljena: selectedRecenzija.value.omiljena,
  }
})

onMounted(() => {
  ucitajPodatke()
})

async function ucitajPodatke() {
  loading.value = true

  try {
    const [interakcijeRes, korisniciRes, knjigeRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/interakcije`),
      axios.get(`${API_BASE_URL}/korisnici`),
      axios.get(`${API_BASE_URL}/knjige`),
    ])

    korisnici.value = Array.isArray(korisniciRes.data) ? korisniciRes.data : []
    knjige.value = Array.isArray(knjigeRes.data) ? knjigeRes.data : []
    rows.value = Array.isArray(interakcijeRes.data) ? interakcijeRes.data.map(mapirajRecenziju) : []
    selected.value = []
  } catch (error) {
    console.error('Failed to fetch admin reviews data', error)
    $q.notify({
      type: 'negative',
      message: 'Neuspjelo učitavanje recenzija.',
    })
  } finally {
    loading.value = false
  }
}

function mapirajRecenziju(interakcija) {
  const korisnikId = Number(interakcija.korisnik_id ?? 0)
  const knjigaId = Number(interakcija.knjiga_id ?? 0)

  return {
    id: interakcija.interakcija_id ?? interakcija.id,
    korisnik_id: korisnikId,
    korisnikLabel: getKorisnikLabel(korisnikId),
    knjiga_id: knjigaId,
    knjigaLabel: getKnjigaLabel(knjigaId),
    ocjena: Number(interakcija.ocjena ?? 0),
    recenzija: interakcija.recenzija ?? '',
    omiljena: Boolean(interakcija.omiljena),
    omiljenaLabel: interakcija.omiljena ? 'Da' : 'Ne',
  }
}

function getKorisnikLabel(korisnikId) {
  const korisnik = korisnici.value.find((item) => Number(item.korisnik_id) === Number(korisnikId))
  return korisnik ? `${korisnik.ime} ${korisnik.prezime}`.trim() : `Korisnik #${korisnikId}`
}

function getKnjigaLabel(knjigaId) {
  const knjiga = knjige.value.find((item) => Number(item.knjiga_id) === Number(knjigaId))
  return knjiga?.naslov ?? `Knjiga #${knjigaId}`
}

function otvoriDodavanje() {
  editingId.value = null
  showDialog.value = true
}

function otvoriUredivanje() {
  if (!selectedRecenzija.value) {
    return
  }

  editingId.value = selectedRecenzija.value.id
  showDialog.value = true
}

async function spremiRecenziju(review) {
  saving.value = true

  try {
    const payload = {
      korisnik_id: review.korisnikId,
      knjiga_id: review.knjigaId,
      ocjena: Number(review.ocjena ?? 0),
      recenzija: review.tekst,
      omiljena: Boolean(review.omiljena),
    }

    const res = editingId.value
      ? await axios.put(`${API_BASE_URL}/interakcije/${editingId.value}`, payload)
      : await axios.post(`${API_BASE_URL}/interakcije`, payload)

    if (![200, 201].includes(res.status)) {
      throw new Error('Failed to save review')
    }

    $q.notify({
      type: 'positive',
      message: editingId.value
        ? 'Recenzija je uspješno ažurirana.'
        : 'Recenzija je uspješno dodana.',
    })

    showDialog.value = false
    editingId.value = null
    await ucitajPodatke()
  } catch (error) {
    console.error('Failed to save review', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.error ?? 'Spremanje recenzije nije uspjelo.',
    })
  } finally {
    saving.value = false
  }
}

function obrisiOdabranuRecenziju() {
  if (!selectedRecenzija.value?.id) {
    return
  }

  $q.dialog({
    title: 'Potvrda brisanja',
    message: 'Želite li obrisati odabranu recenziju?',
    cancel: true,
    persistent: true,
    ok: {
      color: 'negative',
      label: 'Izbriši',
    },
  }).onOk(async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/interakcije/${selectedRecenzija.value.id}`)

      if (res.status !== 200) {
        throw new Error('Failed to delete review')
      }

      $q.notify({
        type: 'warning',
        message: 'Recenzija je obrisana.',
      })

      editingId.value = null
      await ucitajPodatke()
    } catch (error) {
      console.error('Failed to delete review', error)
      $q.notify({
        type: 'negative',
        message: 'Brisanje recenzije nije uspjelo.',
      })
    }
  })
}
</script>
