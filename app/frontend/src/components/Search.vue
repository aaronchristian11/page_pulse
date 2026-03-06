<template>

</template>

<script>
import axios from 'axios';

export default {
    name: "Search",
    data() {
        return {
            searchQuery: '',
            books: []
        }
    },
    methods: {
        async getBooks() {
            await axios.get('https://openlibrary.org/search.json', {
                params: {
                    q: this.searchQuery,
                    limit: 20
                },
                headers: {
                    'User-Agent': 'PagePulse/1.0'
                }
            }).then(res => {
                if (res.num_found !== 0 && res.docs.length !== 0) {
                    this.books = res.docs;
                }
            }).catch(error => console.log(error));
        }
    }
}
</script>

<style scoped>

</style>
