<script>
	import { Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';

    // Accepter des données en prop
    let { data = [], onSelectionChange = ()=>{} , value = []} = $props();

    // État des items affichés (pour le filtrage)
	let items = $state(data);

	// Collection pour gérer les items
	const collection = $derived(
		useListCollection({
			items: items,
			itemToString: (item) => item.label,
			itemToValue: (item) => item,
		}),
	);

	// Réinitialiser les items quand on ouvre/ferme
	const onOpenChange = () => {
		items = data;
	};

	// Filtrer les items selon la saisie
	const onInputValueChange = (event) => {
		const filtered = data.filter((item) => 
			item.label.toLowerCase().includes(event.inputValue.toLowerCase())
		);
		if (filtered.length > 0) {
			items = filtered;
		} else {
			items = [];
		}
	};

	// Mettre à jour les valeurs sélectionnées
	const onValueChange = (event) => {
		value = event.value;
		console.log(value, " from component");
		
		// Appelez la fonction du parent !
		if (onSelectionChange) {
			onSelectionChange(value);
		}
	};
</script>

<div class="grid gap-2 w-full max-w-md">
	<Combobox 
		placeholder="Rechercher..." 
		{collection} 
		{onOpenChange} 
		{onInputValueChange} 
		{value} 
		{onValueChange} 
		multiple
	>
		<Combobox.Control>
			<Combobox.Input />
			<Combobox.Trigger class="w-[1.5rem] h-[1.5rem] button-reset"></Combobox.Trigger>
		</Combobox.Control>
		<Portal>
			<Combobox.Positioner class="z-[1]!">
				<Combobox.Content>
					{#each items as item (item.value)}
						<Combobox.Item {item}>
							<Combobox.ItemText>{item.label}</Combobox.ItemText>
							<Combobox.ItemIndicator />
						</Combobox.Item>
					{/each}
				</Combobox.Content>
			</Combobox.Positioner>
		</Portal>
	</Combobox>
	
	<!-- Affichage des éléments sélectionnés -->
	<div class="flex flex-wrap gap-2">
		{#each value as item (item)}
			<span class="badge preset-filled">
				{item.label}
			</span>
		{/each}
	</div>
</div>
