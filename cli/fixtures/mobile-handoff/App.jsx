import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
const { createClient } = require('./client');
const { createModel } = require('./model');

// Mount inside an existing React Native test app, passing its reachable demo origin.
export default function ReferenceFlow({ baseUrl }) {
  const model = useMemo(() => createModel(createClient({ baseUrl })), [baseUrl]);
  const [state, setState] = useState(model.getState());
  const [title, setTitle] = useState('');
  useEffect(() => {
    setState(model.getState());
    const unsubscribe = model.subscribe(setState);
    return () => { unsubscribe(); model.dispose(); };
  }, [model]);
  const busy = state.status === 'loading';
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
    <Text accessibilityRole="header">Website API → mobile reference</Text>
    <Button title="Load listings" disabled={busy} onPress={() => model.run('list')} />
    <Button title="Open detail" disabled={busy} onPress={() => model.run('detail')} />
    <TextInput accessibilityLabel="Listing title" placeholder="Title" value={title} onChangeText={setTitle} />
    <Button title="Save test listing" disabled={busy || !title.trim()} onPress={() => model.run('save', title)} />
    <Button title="Cancel" disabled={!busy} onPress={model.cancel} />
    <View accessibilityLiveRegion="polite"><Text>{state.status}{state.error ? `: ${state.error}` : ''}</Text></View>
    <Text selectable>{state.data ? JSON.stringify(state.data, null, 2) : ''}</Text>
  </ScrollView>;
}
