<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="stats-card">
      <q-card-section class="row items-center justify-between q-col-gutter-md">
        <div class="col-12 col-md">
          <div class="text-h6 text-weight-medium">Statistika ocjena</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Top 5 knjiga s najboljim prosječnim ocjenama za {{ monthLabel }}
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <q-btn
            outline
            color="primary"
            icon="refresh"
            label="Osvježi"
            :loading="loading"
            @click="ucitajStatistiku"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="loading" class="loading-state">
        <q-spinner color="primary" size="40px" />
      </q-card-section>

      <q-card-section v-else-if="topBooks.length" class="q-gutter-lg">
        <q-list bordered separator class="rounded-borders">
          <q-item v-for="(book, index) in topBooks" :key="book.id" class="q-py-md">
            <q-item-section avatar top>
              <q-badge color="primary" rounded class="q-px-sm q-py-xs">
                #{{ index + 1 }}
              </q-badge>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-subtitle1">{{ book.naslov }}</q-item-label>
              <q-item-label caption class="q-mb-sm">
                {{ book.reviewCount }} recenzija u ovom mjesecu
              </q-item-label>
              <q-linear-progress
                size="12px"
                rounded
                color="amber-8"
                track-color="grey-3"
                :value="book.average / 5"
              />
            </q-item-section>

            <q-item-section side top>
              <div class="text-subtitle1 text-weight-bold text-right">
                {{ formatRating(book.average) }}
              </div>
              <q-rating
                :model-value="book.average"
                max="5"
                readonly
                size="1rem"
                color="amber-8"
                icon="star_border"
                icon-selected="star"
                icon-half="star_half"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section v-else class="empty-state">
        <q-icon name="insights" size="44px" color="grey-5" />
        <div class="text-subtitle1 q-mt-md">Nema dovoljno podataka za prikaz.</div>
        <div class="text-caption text-grey-7 q-mt-sm">
          Za {{ monthLabel }} još nema ocjena knjiga koje bi ušle u statistiku.
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from 'src/config/api'

const $q = useQuasar()

const loading = ref(false)
const topBooks = ref([])

const currentMonthStart = computed(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
})

const nextMonthStart = computed(() => {
  const start = currentMonthStart.value
  return new Date(start.getFullYear(), start.getMonth() + 1, 1)
})

const monthLabel = computed(() =>
  currentMonthStart.value.toLocaleDateString('hr-HR', {
    month: 'long',
    year: 'numeric',
  }),
)

onMounted(() => {
  ucitajStatistiku()
})

async function ucitajStatistiku() {
  loading.value = true

  try {
    const [interakcijeRes, knjigeRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/interakcije`),
      axios.get(`${API_BASE_URL}/knjige`),
    ])

    const interakcije = Array.isArray(interakcijeRes.data) ? interakcijeRes.data : []
    const knjige = Array.isArray(knjigeRes.data) ? knjigeRes.data : []

    const knjigeMap = new Map(
      knjige.map((knjiga) => [Number(knjiga.knjiga_id ?? knjiga.id), knjiga.naslov ?? 'Nepoznata knjiga']),
    )

    const agregirano = new Map()

    interakcije
      .filter((interakcija) => isCurrentMonth(interakcija.vrijeme_ostavljanja))
      .filter((interakcija) => Number(interakcija.ocjena ?? 0) > 0)
      .forEach((interakcija) => {
        const bookId = Number(interakcija.knjiga_id ?? 0)
        const ocjena = Number(interakcija.ocjena ?? 0)

        if (!bookId || !ocjena) {
          return
        }

        const trenutna = agregirano.get(bookId) ?? {
          id: bookId,
          naslov: knjigeMap.get(bookId) ?? `Knjiga #${bookId}`,
          total: 0,
          reviewCount: 0,
        }

        trenutna.total += ocjena
        trenutna.reviewCount += 1
        agregirano.set(bookId, trenutna)
      })

    topBooks.value = Array.from(agregirano.values())
      .map((book) => ({
        id: book.id,
        naslov: book.naslov,
        reviewCount: book.reviewCount,
        average: Number((book.total / book.reviewCount).toFixed(2)),
      }))
      .sort((a, b) => b.average - a.average || b.reviewCount - a.reviewCount || a.naslov.localeCompare(b.naslov))
      .slice(0, 5)
  } catch (error) {
    console.error('Failed to fetch admin statistics', error)
    $q.notify({
      type: 'negative',
      message: 'Neuspjelo učitavanje statistike.',
    })
    topBooks.value = []
  } finally {
    loading.value = false
  }
}

function isCurrentMonth(value) {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date >= currentMonthStart.value && date < nextMonthStart.value
}

function formatRating(value) {
  return Number(value ?? 0).toFixed(2)
}
</script>

<style scoped>
.loading-state,
.empty-state {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}
</style>
