<template>
  <q-page class="q-pa-md flex justify-center">
    <div class="page-wrapper">
      <q-card flat bordered class="full-width">
        <q-card-section class="row items-center justify-between">
          <q-btn label="Povratak" outline color="primary" @click="idiNatrag" />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="text-h5 text-weight-bold text-center q-mb-xl">
            {{ naslovKnjige }}
          </div>

          <div class="row justify-between text-subtitle1 text-weight-bold q-mb-sm">
            <div>Početak</div>
            <div>Kraj</div>
          </div>

          <q-slider
            v-model="currentTime"
            :min="0"
            :max="duration || 1"
            :step="1"
            color="primary"
            class="q-mb-md"
            @change="promijeniPoziciju"
          />

          <div class="row justify-between text-caption q-mb-lg">
            <div>{{ formatirajVrijeme(currentTime) }}</div>
            <div>{{ formatirajVrijeme(duration) }}</div>
          </div>

          <div class="row justify-center q-gutter-sm">
            <q-btn label="Pokreni" color="primary" @click="pokreni" />
            <q-btn label="Pauziraj" outline color="primary" @click="pauziraj" />
            <q-btn label="Zaustavi" outline color="negative" @click="zaustavi" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <audio
      ref="audioRef"
      :src="audioSrc"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onAudioEnded"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'
import { getCurrentUserId } from 'src/composables/auth'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const audioRef = ref(null)
const knjiga = ref({
  naslov: '',
  poveznica: '',
})
const currentTime = ref(0)
const duration = ref(0)
const historyLoaded = ref(false)
const syncingPlayback = ref(false)
const hasCountedCurrentPlayback = ref(false)
const playbackStartedAt = ref(0)
const currentUserId = computed(() => Number(getCurrentUserId() ?? 0))
const knjigaId = computed(() => Number(route.params.id ?? 0))

const naslovKnjige = computed(() => knjiga.value.naslov || 'Naslov knjige')
const audioSrc = computed(() => {
  const poveznica = knjiga.value.poveznica?.trim()

  if (!poveznica) {
    return ''
  }

  if (poveznica.startsWith('http://') || poveznica.startsWith('https://')) {
    return poveznica
  }

  return `http://localhost:5000/stream?file=sample.mp3`
})

onMounted(() => {
  ucitajKnjigu()
})

onBeforeUnmount(() => {
  if (audioRef.value) {
    audioRef.value.pause()
  }

  syncPlaybackState({ statusSlusanjaId: 1 }).catch((error) => {
    console.error('Failed to sync playback on unmount', error)
  })
})

function idiNatrag() {
  router.back()
}

async function ucitajKnjigu() {
  if (!knjigaId.value) {
    $q.notify({ type: 'negative', message: 'Nedostaje ID knjige.' })
    return
  }

  try {
    const [bookRes, historyRes] = await Promise.allSettled([
      axios.get(`${API_BASE_URL}/knjige/${knjigaId.value}`),
      ucitajPovijestSlusanja(),
    ])

    if (bookRes.status !== 'fulfilled') {
      throw bookRes.reason
    }

    if (bookRes.value.status !== 200) {
      throw new Error('Failed to fetch book details')
    }

    const data = bookRes.value.data ?? {}

    knjiga.value = {
      naslov: data.naslov ?? data.title ?? '',
      poveznica: data.poveznica ?? '',
    }

    if (historyRes.status === 'rejected') {
      console.error('Failed to fetch listening history', historyRes.reason)
    }

    if (!knjiga.value.poveznica) {
      $q.notify({ type: 'warning', message: 'Ova knjiga nema dostupnu audio poveznicu.' })
    }
  } catch (error) {
    console.error('Failed to fetch book details', error)
    $q.notify({ type: 'negative', message: 'Neuspjelo učitavanje knjige.' })
  }
}

async function pokreni() {
  if (!audioRef.value || !audioSrc.value) {
    $q.notify({ type: 'warning', message: 'Audio nije dostupan za reprodukciju.' })
    return
  }

  try {
    if (!historyLoaded.value) {
      await ucitajPovijestSlusanja()
    }

    if (audioRef.value.readyState === 0) {
      audioRef.value.load()
    }

    playbackStartedAt.value = audioRef.value.currentTime ?? currentTime.value ?? 0
    await audioRef.value.play()
    await syncPlaybackState({
      statusSlusanjaId: 1,
      inkrementirajSlusanje: !hasCountedCurrentPlayback.value,
      vrijemeSlusanja: 0,
    })
    hasCountedCurrentPlayback.value = true
  } catch (error) {
    console.error('Playback failed', error)
    $q.notify({
      type: 'negative',
      message: 'Reprodukcija nije uspjela. Provjeri postoji li MP3 na music-serviceu.',
    })
  }
}

async function pauziraj() {
  if (!audioRef.value) {
    return
  }

  audioRef.value.pause()
  await syncPlaybackState({ statusSlusanjaId: 1 })
}

async function zaustavi() {
  if (!audioRef.value) {
    return
  }

  audioRef.value.pause()
  await syncPlaybackState({ pozicija: 0, statusSlusanjaId: 1 })
  audioRef.value.currentTime = 0
  currentTime.value = 0
  playbackStartedAt.value = 0
  hasCountedCurrentPlayback.value = false
}

async function promijeniPoziciju(value) {
  if (!audioRef.value) {
    return
  }

  audioRef.value.currentTime = value
  currentTime.value = value
  playbackStartedAt.value = value
  await syncPlaybackState({ pozicija: value, statusSlusanjaId: 1, vrijemeSlusanja: 0 })
}

function onLoadedMetadata() {
  duration.value = Number.isFinite(audioRef.value?.duration) ? audioRef.value.duration : 0

  if (audioRef.value && currentTime.value > 0) {
    audioRef.value.currentTime = currentTime.value
  }
}

function onTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime ?? 0
}

function onAudioEnded() {
  syncPlaybackState({ pozicija: 0, statusSlusanjaId: 2 }).catch((error) => {
    console.error('Failed to sync playback on end', error)
  })

  currentTime.value = 0
  playbackStartedAt.value = 0
  hasCountedCurrentPlayback.value = false
}

function formatirajVrijeme(value) {
  const totalSeconds = Math.max(0, Math.floor(value || 0))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

async function ucitajPovijestSlusanja() {
  if (!currentUserId.value || !knjigaId.value) {
    historyLoaded.value = true
    return
  }

  try {
    const res = await axios.get(
      `${API_BASE_URL}/povijest_slusanja/korisnik/${currentUserId.value}/knjiga/${knjigaId.value}`,
    )

    if (res.status === 200) {
      const pozicija = Number(res.data?.pozicija ?? 0)
      currentTime.value = pozicija

      if (audioRef.value) {
        audioRef.value.currentTime = pozicija
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error
    }
  } finally {
    historyLoaded.value = true
  }
}

async function syncPlaybackState({
  pozicija = currentTime.value,
  statusSlusanjaId = 1,
  inkrementirajSlusanje = false,
  vrijemeSlusanja,
} = {}) {
  if (!currentUserId.value || !knjigaId.value || syncingPlayback.value) {
    return
  }

  syncingPlayback.value = true

  try {
    const effectivePosition = Math.max(0, Math.floor(Number(pozicija ?? currentTime.value ?? 0)))
    const listenedSeconds =
      vrijemeSlusanja ?? Math.max(0, Math.floor((audioRef.value?.currentTime ?? effectivePosition) - playbackStartedAt.value))

    await axios.post(`${API_BASE_URL}/povijest_slusanja/sync`, {
      korisnik_id: currentUserId.value,
      knjiga_id: knjigaId.value,
      pozicija: effectivePosition,
      statusSlusanja_id: statusSlusanjaId,
      inkrementiraj_slusanje: inkrementirajSlusanje,
      vrijeme_slusanja: listenedSeconds,
    })

    playbackStartedAt.value = audioRef.value?.currentTime ?? effectivePosition
  } catch (error) {
    console.error('Failed to sync playback state', error)
  } finally {
    syncingPlayback.value = false
  }
}
</script>

<style scoped>
.page-wrapper {
  width: 100%;
}
</style>
