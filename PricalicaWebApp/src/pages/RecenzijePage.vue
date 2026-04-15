<template>
  <q-page padding>
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-auto">
        <q-btn label="Dodaj novu" color="primary" @click="otvoriDodavanje" />
      </div>

      <div class="col text-center">
        <div class="text-h6">Vaše recenzije</div>
      </div>

      <div class="col-auto">
        <div class="row q-gutter-sm">
          <q-btn
            label="Pregledaj"
            outline
            color="primary"
            :disable="selected.length !== 1"
            @click="otvoriPregled"
          />
          <q-btn
            label="Uredi"
            outline
            color="primary"
            :disable="selected.length !== 1"
            @click="otvoriUredivanje"
          />
          <q-btn
            label="IZBRIŠI"
            outline
            color="negative"
            :disable="selected.length !== 1"
            @click="obrisiRecenziju"
          />
        </div>
      </div>
    </div>

    <q-table
      flat
      bordered
      :rows="rows"
      :columns="columns"
      :loading="loading"
      row-key="id"
      selection="single"
      v-model:selected="selected"
      no-data-label="Nemate recenzija za prikaz."
    />

    <review-dialog
      v-model="showDialog"
      :books="books"
      :initial-review="dialogReview"
      @save="spremiRecenziju"
    />

    <q-dialog v-model="showPreviewDialog">
      <q-card class="preview-dialog">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6">Pregled recenzije</div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section v-if="selectedReview">
          <div class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold">Knjiga</div>
            <div>{{ selectedReview.naslov }}</div>
          </div>

          <div class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold">Ocjena</div>
            <q-rating
              :model-value="selectedReview.ocjena"
              readonly
              size="1.8rem"
              color="primary"
              icon="star_border"
              icon-selected="star"
              icon-half="star_half"
            />
          </div>

          <div class="q-mb-md">
            <div class="text-subtitle2 text-weight-bold">Dojam</div>
            <div>{{ selectedReview.utisci }}</div>
          </div>

          <div>
            <div class="text-subtitle2 text-weight-bold">Recenzija</div>
            <div class="review-text">{{ selectedReview.recenzija }}</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from 'src/config/api'
import { getCurrentUserId } from 'src/composables/auth'
import ReviewDialog from 'src/pages/RecenzijaDialogPage.vue'

const $q = useQuasar()

const loading = ref(false)
const showDialog = ref(false)
const showPreviewDialog = ref(false)
const selected = ref([])
const rows = ref([])
const books = ref([])
const editingId = ref(null)

const currentUserId = computed(() => Number(getCurrentUserId() ?? 0))
const selectedReview = computed(() => selected.value[0] ?? null)
const dialogReview = computed(() => {
  if (!selectedReview.value || !editingId.value) {
    return {
      korisnikId: currentUserId.value || null,
      knjigaId: null,
      ocjena: 0,
      tekst: '',
      omiljena: false,
    }
  }

  return {
    korisnikId: currentUserId.value || null,
    knjigaId: selectedReview.value.knjigaId,
    ocjena: selectedReview.value.ocjena,
    tekst: selectedReview.value.recenzija,
    omiljena: false,
  }
})

const columns = [
  {
    name: 'naslov',
    label: 'Naslov',
    field: 'naslov',
    align: 'left',
    sortable: true,
  },
  {
    name: 'recenzija',
    label: 'Recenzija',
    field: 'recenzija',
    align: 'left',
    sortable: true,
  },
  {
    name: 'ocjena',
    label: 'Ocjena',
    field: 'ocjena',
    align: 'center',
    sortable: true,
  },
  {
    name: 'utisci',
    label: 'Utisci',
    field: 'utisci',
    align: 'left',
    sortable: true,
  },
]

onMounted(() => {
  ucitajPodatke()
})

async function ucitajPodatke() {
  if (!currentUserId.value) {
    rows.value = []
    books.value = []
    return
  }

  loading.value = true

  try {
    const [interakcijeRes, knjigeRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/interakcije`),
      axios.get(`${API_BASE_URL}/knjige`),
    ])

    books.value = Array.isArray(knjigeRes.data)
      ? knjigeRes.data.map((knjiga) => ({
          id: knjiga.knjiga_id,
          naslov: knjiga.naslov,
        }))
      : []

    const interakcije = Array.isArray(interakcijeRes.data) ? interakcijeRes.data : []

    rows.value = interakcije
      .filter((item) => Number(item.korisnik_id) === currentUserId.value)
      .map(mapirajRecenziju)

    selected.value = []
  } catch (error) {
    console.error('Failed to fetch user reviews', error)
    $q.notify({
      type: 'negative',
      message: 'Neuspjelo učitavanje recenzija.',
    })
  } finally {
    loading.value = false
  }
}

function mapirajRecenziju(interakcija) {
  const knjigaId = Number(interakcija.knjiga_id ?? 0)
  const ocjena = Number(interakcija.ocjena ?? 0)

  return {
    id: interakcija.interakcija_id ?? interakcija.id,
    knjigaId,
    naslov: getBookTitle(knjigaId),
    recenzija: interakcija.recenzija ?? '',
    ocjena,
    utisci: ocjena >= 4 ? 'Odlično' : ocjena >= 2 ? 'Dobro' : 'Slabo',
  }
}

function getBookTitle(knjigaId) {
  const knjiga = books.value.find((item) => Number(item.id) === Number(knjigaId))
  return knjiga?.naslov ?? `Knjiga #${knjigaId}`
}

function otvoriDodavanje() {
  if (!currentUserId.value) {
    $q.notify({
      type: 'warning',
      message: 'Za rad s recenzijama potrebno je ponovno se prijaviti.',
    })
    return
  }

  editingId.value = null
  showDialog.value = true
}

function otvoriPregled() {
  if (!selectedReview.value) {
    return
  }

  showPreviewDialog.value = true
}

function otvoriUredivanje() {
  if (!selectedReview.value) {
    return
  }

  editingId.value = selectedReview.value.id
  showDialog.value = true
}

async function spremiRecenziju(review) {
  if (!currentUserId.value) {
    $q.notify({
      type: 'warning',
      message: 'Za spremanje recenzije potrebno je ponovno se prijaviti.',
    })
    return
  }

  try {
    const payload = {
      korisnik_id: currentUserId.value,
      knjiga_id: Number(review.knjigaId ?? 0),
      ocjena: Number(review.ocjena ?? 0),
      recenzija: review.tekst ?? '',
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
  }
}

async function obrisiRecenziju() {
  if (!selectedReview.value?.id) {
    return
  }

  try {
    const res = await axios.delete(`${API_BASE_URL}/interakcije/${selectedReview.value.id}`)

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
}
</script>

<style scoped>
.preview-dialog {
  width: 560px;
  max-width: 92vw;
}

.review-text {
  white-space: pre-wrap;
}
</style>
