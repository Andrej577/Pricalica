<template>
  <q-page class="q-pa-md">
    <div class="page-wrapper">
      <q-input v-model="search" outlined dense placeholder="Pretraži knjigu" class="q-mb-md">
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-card flat bordered class="q-mb-md">
        <q-card-section class="text-subtitle1 text-weight-bold">
          Nastavi sa slušanjem
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="book-grid">
            <q-card
              v-for="item in filteredContinueListening"
              :key="item.id"
              flat
              bordered
              class="book-card cursor-pointer"
              @click="otvoriDetaljeKnjige(item.id)"
            >
              <div class="book-cover-placeholder">
                <q-icon name="menu_book" size="56px" color="grey-5" />
              </div>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-center ellipsis">
                  {{ item.title }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section class="text-subtitle1 text-weight-bold">Biblioteka</q-card-section>

        <q-separator />

        <q-card-section>
          <div class="book-grid">
            <q-card
              v-for="item in filteredLibrary"
              :key="item.id"
              flat
              bordered
              class="book-card cursor-pointer"
              @click="otvoriDetaljeKnjige(item.id)"
            >
              <div class="book-cover-placeholder">
                <q-icon name="menu_book" size="56px" color="grey-5" />
              </div>
              <q-card-section class="q-pa-sm">
                <div class="text-caption text-center ellipsis">
                  {{ item.title }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import { API_BASE_URL } from 'src/config/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const $q = useQuasar()

const search = ref('')
const continueListening = ref([])
const library = ref([])

const filteredContinueListening = computed(() => {
  if (!search.value.trim()) return continueListening.value

  return continueListening.value.filter((item) =>
    item.title.toLowerCase().includes(search.value.toLowerCase()),
  )
})

const filteredLibrary = computed(() => {
  if (!search.value.trim()) return library.value

  return library.value.filter((item) =>
    item.title.toLowerCase().includes(search.value.toLowerCase()),
  )
})

function otvoriDetaljeKnjige(id) {
  router.push(`/knjige/${id}`)
}

async function getSveKnjige() {
  try {
    const res = await axios.get(`${API_BASE_URL}/knjige`)

    if (res.status !== 200 || !Array.isArray(res.data)) {
      throw new Error('Failed to fetch books')
    }

    const knjige = res.data.map((item) => ({
      id: item.knjiga_id,
      title: item.naslov,
      opis: item.opis,
      trajanje_min: item.trajanje_min,
      poveznica: item.poveznica,
      prosjecna_ocjena: item.prosjecna_ocjena,
    }))

    library.value = knjige
    continueListening.value = knjige.slice(0, 4)
  } catch (error) {
    console.error('Error fetching books:', error)
    $q.notify({
      type: 'negative',
      message: 'Neuspjelo učitavanje knjiga.',
    })
  }
}

onMounted(() => {
  getSveKnjige()
})
</script>

<style scoped>
.page-wrapper {
  width: 100%;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.book-card {
  overflow: hidden;
}

.book-cover-placeholder {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #ddd;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}
</style>
