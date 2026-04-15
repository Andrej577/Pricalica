<template>
  <q-page class="q-pa-md flex justify-center">
    <div class="page-wrapper">
      <q-card flat bordered class="full-width">
        <q-card-section class="row items-center justify-between">
          <q-btn label="Povratak" outline color="primary" @click="idiNatrag" />

          <q-btn
            label="Pokreni"
            color="primary"
            :disable="!knjiga.poveznica"
            @click="pokreniKnjigu"
          />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-h5 text-weight-bold text-center q-mb-lg" data-testid="book-title">
            {{ knjiga.naslov }}
          </div>

          <div class="row q-col-gutter-xl q-mb-lg">
            <div class="col-12 col-md-4">
              <div class="q-mb-md">
                <div class="text-subtitle1 text-weight-bold">Autor</div>
                <div>{{ knjiga.autor }}</div>
              </div>

              <div>
                <div class="text-subtitle1 text-weight-bold">Žanr</div>
                <div>{{ knjiga.zanr }}</div>
              </div>
            </div>

            <div class="col-12 col-md-8">
              <div class="text-subtitle1 text-weight-bold q-mb-sm">Opis</div>
              <div>{{ knjiga.opis }}</div>
            </div>
          </div>

          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle1 text-weight-bold">Recenzije</div>
            <q-btn label="Dodaj recenziju" outline color="primary" @click="otvoriRecenzijaDialog" />
          </div>

          <q-markup-table flat bordered separator="cell">
            <thead>
              <tr>
                <th class="text-left">Datum</th>
                <th class="text-left">Ime</th>
                <th class="text-left">Prezime</th>
                <th class="text-left">Recenzija</th>
                <th class="text-left">Ocjena</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="recenzija in recenzije" :key="recenzija.id">
                <td>{{ recenzija.datum }}</td>
                <td>{{ recenzija.ime }}</td>
                <td>{{ recenzija.prezime }}</td>
                <td>{{ recenzija.tekst }}</td>
                <td>{{ recenzija.ocjena }}</td>
              </tr>

              <tr v-if="recenzije.length === 0">
                <td colspan="5" class="text-center">Nema recenzija</td>
              </tr>
            </tbody>
          </q-markup-table>
      </q-card-section>
    </q-card>

    <review-dialog
      v-model="showReviewDialog"
      :books="bookOptions"
      :initial-review="dialogReview"
      @save="spremiRecenziju"
    />
  </div>
</q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'
import { getCurrentUserId } from 'src/composables/auth'
import ReviewDialog from 'src/pages/RecenzijaDialogPage.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const knjiga = ref({
  naslov: '',
  autor: '',
  zanr: '',
  opis: '',
  poveznica: '',
})
const recenzije = ref([])
const showReviewDialog = ref(false)

const currentUserId = computed(() => Number(getCurrentUserId() ?? 0))
const currentBookId = computed(() => Number(route.params.id ?? 0))
const bookOptions = computed(() => [
  {
    id: currentBookId.value,
    naslov: knjiga.value.naslov || `Knjiga #${currentBookId.value}`,
  },
])
const dialogReview = computed(() => ({
  korisnikId: currentUserId.value || null,
  knjigaId: currentBookId.value || null,
  ocjena: 0,
  tekst: '',
  omiljena: false,
}))

onMounted(() => {
  ucitajPodatke()
})

async function ucitajPodatke() {
  const knjigaId = route.params.id

  if (!knjigaId) {
    $q.notify({ type: 'negative', message: 'Nedostaje ID knjige.' })
    return
  }

  await Promise.all([getKnjigaDetalji(knjigaId), getRecenzije(knjigaId)])
}

function idiNatrag() {
  router.back()
}

function pokreniKnjigu() {
  if (!knjiga.value.poveznica) {
    $q.notify({ type: 'warning', message: 'Ova knjiga nema dostupnu poveznicu.' })
    return
  }

  router.push(`/knjige/${route.params.id}/reprodukcija`)
}

function otvoriRecenzijaDialog() {
  if (!currentUserId.value) {
    $q.notify({
      type: 'warning',
      message: 'Za dodavanje recenzije potrebno je ponovno se prijaviti.',
    })
    return
  }

  showReviewDialog.value = true
}

async function getRecenzije(knjigaId) {
  try {
    const res = await axios.get(`${API_BASE_URL}/interakcije/knjiga/${knjigaId}`)

    if (res.status !== 200) {
      throw new Error('Failed to fetch reviews')
    }

    recenzije.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Failed to fetch reviews', error)
    recenzije.value = []
    $q.notify({ type: 'negative', message: 'Neuspjelo učitavanje recenzija.' })
  }
}

async function getKnjigaDetalji(knjigaId) {
  try {
    const res = await axios.get(`${API_BASE_URL}/knjige/${knjigaId}`)

    if (res.status !== 200) {
      throw new Error('Failed to fetch book details')
    }

    const data = res.data ?? {}

    knjiga.value = {
      naslov: data.naslov ?? '',
      autor: data.autor ?? '',
      zanr: data.zanr ?? '',
      opis: data.opis ?? '',
      poveznica: data.poveznica ?? '',
    }
  } catch (error) {
    console.error('Failed to fetch book details', error)
    $q.notify({ type: 'negative', message: 'Neuspjelo učitavanje detalja knjige.' })
  }
}

async function spremiRecenziju(review) {
  if (!currentUserId.value || !currentBookId.value) {
    $q.notify({
      type: 'negative',
      message: 'Nedostaju podaci za spremanje recenzije.',
    })
    return
  }

  try {
    const payload = {
      korisnik_id: currentUserId.value,
      knjiga_id: currentBookId.value,
      ocjena: Number(review.ocjena ?? 0),
      recenzija: review.tekst ?? '',
      omiljena: Boolean(review.omiljena),
    }

    const res = await axios.post(`${API_BASE_URL}/interakcije`, payload)

    if (![200, 201].includes(res.status)) {
      throw new Error('Failed to save review')
    }

    $q.notify({
      type: 'positive',
      message: 'Recenzija je uspješno dodana.',
    })

    showReviewDialog.value = false
    await getRecenzije(currentBookId.value)
  } catch (error) {
    console.error('Failed to save review', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.error ?? 'Spremanje recenzije nije uspjelo.',
    })
  }
}
</script>

<style scoped>
.page-wrapper {
  width: 100%;
}
</style>
