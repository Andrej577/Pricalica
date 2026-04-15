<template>
  <q-dialog v-model="isOpen" @hide="handleHide">
    <q-card class="review-dialog">
      <q-card-section class="row items-center justify-between q-pb-sm">
        <q-btn label="Povratak" flat color="grey-8" @click="onBack" />

        <q-btn
          label="Spremi"
          color="positive"
          :disable="!canSave"
          @click="onSave"
        />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-select
          v-if="showUserSelect"
          v-model="form.korisnikId"
          :options="userOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          label="Odaberi korisnika"
          outlined
          class="q-mb-lg"
        />

        <q-select
          v-model="form.knjigaId"
          :options="bookOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          label="Odaberi knjigu"
          outlined
          class="q-mb-lg"
        />

        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-auto">
          <q-rating
            v-model="form.ocjena"
            size="2.2rem"
            color="primary"
            icon="star_border"
            icon-selected="star"
            icon-half="star_half"
          />
          </div>

          <div v-if="showFavorite" class="col-auto">
            <q-btn
              flat
              round
              :color="form.omiljena ? 'negative' : 'grey-6'"
              :icon="form.omiljena ? 'favorite' : 'favorite_border'"
              @click="form.omiljena = !form.omiljena"
            />
          </div>
        </div>

        <q-input
          v-model="form.tekst"
          type="textarea"
          outlined
          autogrow
          label="Tekst recenzije"
          input-style="min-height: 180px;"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  books: {
    type: Array,
    default: () => [],
  },
  users: {
    type: Array,
    default: () => [],
  },
  initialReview: {
    type: Object,
    default: () => null,
  },
  showUserSelect: {
    type: Boolean,
    default: false,
  },
  showFavorite: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const form = reactive({
  korisnikId: null,
  knjigaId: null,
  ocjena: 0,
  tekst: '',
  omiljena: false,
})

const bookOptions = computed(() =>
  props.books.map((x) => ({
    label: x.naziv ?? x.naslov ?? `Knjiga ${x.id}`,
    value: x.id,
  })),
)

const userOptions = computed(() =>
  props.users.map((x) => ({
    label: x.naziv ?? `${x.ime ?? ''} ${x.prezime ?? ''}`.trim(),
    value: x.id,
  })),
)

const canSave = computed(() => {
  const hasUser = !props.showUserSelect || !!form.korisnikId
  return hasUser && !!form.knjigaId && !!form.ocjena && !!form.tekst.trim()
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      populateForm()
    }
  },
)

function populateForm() {
  form.korisnikId = props.initialReview?.korisnikId ?? null
  form.knjigaId = props.initialReview?.knjigaId ?? null
  form.ocjena = props.initialReview?.ocjena ?? 0
  form.tekst = props.initialReview?.tekst ?? ''
  form.omiljena = props.initialReview?.omiljena ?? false
}

function resetForm() {
  form.korisnikId = null
  form.knjigaId = null
  form.ocjena = 0
  form.tekst = ''
  form.omiljena = false
}

function handleHide() {
  resetForm()
}

function onBack() {
  isOpen.value = false
}

function onSave() {
  emit('save', {
    korisnikId: form.korisnikId,
    knjigaId: form.knjigaId,
    ocjena: form.ocjena,
    tekst: form.tekst,
    omiljena: form.omiljena,
  })

  isOpen.value = false
}
</script>

<style scoped>
.review-dialog {
  width: 520px;
  max-width: 90vw;
}
</style>
