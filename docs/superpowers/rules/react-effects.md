# React Effects Convention

Source: React official guidance ("Synchronizing with Effects", "You Might Not Need an Effect", `set-state-in-effect` lint rule). This file is the house digest; the rule below is binding, the patterns are the approved replacements.

## The rule

**Use `useEffect` to synchronize React with something outside React, not to keep your own React state synchronized with other React state.**

React's official guidance is to derive values during rendering, handle user-triggered work in event handlers, and reserve Effects for synchronization with external systems.

Before writing any `useEffect`, ask in order: (1) can I calculate this during render — if yes, do that; (2) did a user action cause this — if yes, event handler; (3) am I resetting state because a prop changed — consider `key`; (4) am I synchronizing with an external system — if not, the effect probably isn't needed; (5) does it update state synchronously at setup — reconsider, derive instead; (6) does it start async work — add cleanup and stale-result handling.

Don't aim for zero `useEffect`. Aim for zero unnecessary synchronization between React state variables.

## 1. Patterns to replace `useEffect`

### Pattern 1 — Derive state during render

Problem: you store a value that can already be calculated from props or existing state.

```tsx
// ❌ Avoid
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

```tsx
// ✅ Derive it
const fullName = `${firstName} ${lastName}`;
```

Another common example is filtering data:

```tsx
// ❌ Avoid
const [filteredItems, setFilteredItems] = useState<Item[]>([]);

useEffect(() => {
  setFilteredItems(items.filter((item) => item.active));
}, [items]);
```

```tsx
// ✅ Derive it
const filteredItems = items.filter((item) => item.active);
```

Use `useMemo` only when the calculation is expensive enough to justify memoization:

```tsx
const filteredItems = useMemo(
  () => expensiveFilter(items, filters),
  [items, filters],
);
```

Rule: if a value can be calculated from the current props and state, don't store a second copy of it. Never mirror it into a second state via an effect.

### Pattern 2 — Use event handlers for user-triggered actions

Problem: an Effect watches a state variable to infer that the user did something.

```tsx
// ❌ Avoid
const [shouldSubmit, setShouldSubmit] = useState(false);

useEffect(() => {
  if (shouldSubmit) {
    submitForm();
  }
}, [shouldSubmit]);
```

```tsx
// ✅ The event already tells you what happened
function handleSubmit() {
  submitForm();
}
```

The same applies to notifications, navigation, analytics for a specific click, and POST requests initiated by a button:

```tsx
async function handleBuy() {
  await addToCart(product);
  showNotification("Added to cart");
}
```

Avoid adding an Effect merely to react to state that an event handler just changed. That introduces another step and can accidentally repeat an action when the component mounts. Clicks, submits, navigation, analytics, and button-initiated POSTs belong in handlers — never set a flag in state for an effect to react to.

### Pattern 3 — Use a `key` to reset component state

Problem: a form should reset whenever the selected user changes.

```tsx
// ❌ Avoid
useEffect(() => {
  setName(user.name);
  setEmail(user.email);
}, [user]);
```

Instead, make the component's identity depend on the user:

```tsx
<UserForm key={user.id} user={user} />

function UserForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  // ...
}
```

When `user.id` changes, React remounts `UserForm` and initializes its state for the new user.

Use this when changing the entity should reset the component's local state. Don't use it when you need to preserve state across entity changes.

### Pattern 4 — Store an ID rather than a duplicated object

Problem: the selected object is stored separately from the list it belongs to.

```tsx
// ❌ Two values that can become inconsistent
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

If `items` changes, `selectedItem` may refer to an outdated object.

```tsx
// ✅ Store the minimal source of truth
const [selectedId, setSelectedId] = useState<string | null>(null);

const selectedItem = items.find((item) => item.id === selectedId) ?? null;
```

This avoids an Effect to synchronize `selectedItem` whenever `items` changes.

Rule: store the minimum independent state needed to represent the UI; derive the rest.

### Pattern 5 — Use a reducer for related state transitions

Problem: multiple Effects form a chain where updating one state variable triggers updates to others.

```tsx
// ❌ Fragile
useEffect(() => {
  if (card?.isGold) {
    setGoldCount((count) => count + 1);
  }
}, [card]);

useEffect(() => {
  if (goldCount > 3) {
    setRound((round) => round + 1);
    setGoldCount(0);
  }
}, [goldCount]);
```

Move the business transition into a reducer or an event handler:

```tsx
type GameState = {
  goldCount: number;
  round: number;
};

type Action = { type: "place-gold-card" };

function reducer(state: GameState, action: Action): GameState {
  if (action.type === "place-gold-card") {
    const nextCount = state.goldCount + 1;

    if (nextCount > 3) {
      return {
        goldCount: 0,
        round: state.round + 1,
      };
    }

    return { ...state, goldCount: nextCount };
  }

  return state;
}

const [game, dispatch] = useReducer(reducer, {
  goldCount: 0,
  round: 1,
});

// In the event handler:
dispatch({ type: "place-gold-card" });
```

The reducer calculates the next state as one transition. It doesn't need Effects to propagate changes between state variables.

This pattern is particularly useful for forms with dependent fields, multi-step workflows, and complicated UI state machines.

## 2. When you really need `useEffect`

Use this decision table:

| Requirement | Recommended pattern |
|---|---|
| Calculate a value from props/state | Render-time calculation |
| Handle a click or form submission | Event handler |
| Reset state when the entity changes | `key` |
| Update related state consistently | `useReducer` |
| Subscribe to an external store | `useSyncExternalStore` (writes *to* a client store may stay in an effect — that is external sync) |
| Attach an event listener | `useEffect` + cleanup |
| Synchronize a third-party widget | `useEffect` |
| Fetch and cache server data | TanStack Query or framework data APIs (house: `queries.ts` hooks + `service.ts`) |
| Read browser layout measurements | `useLayoutEffect` when pre-paint measurement is necessary |
| Event listener / timer / DOM prop / object-URL lifecycle | `useEffect` + cleanup |
| Client UI state, cross-screen | TanStack Store (house: `features/*/store.ts`) — never server snapshots |
| Fire-and-notify once on async failure | `useEffect` with a once-guard ref, or an inline alert instead of a toast |

React documents Effects as a way to synchronize with external systems, rather than as a general mechanism for updating component state.

### Pattern 6 — Put state updates inside external event callbacks, not the Effect body

Suppose a component needs to display the current online status of a service.

```tsx
// ❌ Subscribe, then synchronously update state in the Effect
useEffect(() => {
  const connected = getConnectionStatus();
  setIsOnline(connected);

  return subscribeToConnection(setIsOnline);
}, []);
```

If the service exposes an external store with a snapshot and a subscription API, use `useSyncExternalStore`:

```tsx
const isOnline = useSyncExternalStore(
  connectionStore.subscribe,
  connectionStore.getSnapshot,
);
```

The store must implement the expected subscription and snapshot contracts. React handles subscribing and re-rendering when the snapshot changes.

For a regular browser event listener, an Effect can instead set up the listener and remove it during cleanup. If the listener needs to update UI state, the update belongs in the listener's callback, not in the synchronous setup code:

```tsx
useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);
```

Here, `useEffect` manages the subscription lifecycle; the browser events cause the state updates. This is an appropriate use of an Effect.

### Pattern 7 — Avoid synchronous loading-state updates in fetch Effects

A frequent anti-pattern is:

```tsx
useEffect(() => {
  setLoading(true); // ❌ Synchronous update

  fetchData()
    .then(setData)
    .finally(() => setLoading(false));
}, [query]);
```

Prefer a server-state library such as TanStack Query, which manages fetching, loading status, caching, and request lifecycle for you (house: reads use retry-except-control-flow — a retry function that settles control-flow statuses like 404 immediately but retries real failures; never blanket `retry: false` on reads).

If you must implement fetching manually, asynchronous result updates are different from synchronous state updates inside the Effect:

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetchData(query, { signal: controller.signal })
    .then(setData)
    .catch((error) => {
      if (error.name !== "AbortError") {
        reportError(error);
      }
    });

  return () => controller.abort();
}, [query]);
```

This example assumes `fetchData` supports an `AbortSignal`. It avoids calling a setter synchronously when the Effect starts, and aborts the request during cleanup. A production implementation must also handle loading and error presentation appropriately.

React's `set-state-in-effect` lint rule specifically targets unnecessary synchronous state updates inside Effects. It does not mean that every state update originating from an asynchronous operation or external event is inherently wrong.

## 3. The mental checklist

Before writing any `useEffect`, ask these questions in order:

1. Can I calculate this value during render? If yes, do that.
2. Did a user action cause this work? If yes, use an event handler.
3. Am I trying to reset state because a prop changed? Consider a `key` or a better source of truth.
4. Am I synchronizing with an external system? If not, the Effect probably isn't needed.
5. Does the Effect need to update state immediately? Reconsider the design. Derive loading/status where possible, or use an appropriate external-state abstraction.
6. Does the Effect subscribe or start asynchronous work? Add proper cleanup and handle stale results or cancellation.

For an enforceable team convention, enable the official `set-state-in-effect` rule in `eslint-plugin-react-hooks`. See the [official rule documentation](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect).

The important distinction: don't aim for zero `useEffect` calls at all costs. Aim for zero unnecessary synchronization between React state variables. Effects are appropriate when an external system must be synchronized; render calculations, event handlers, reducers, and external-store APIs solve the other cases more directly.

## House notes

- `enabled: isLoaded` on mount queries is external-system sync (Clerk), not state sync: a tokenless fetch is a guaranteed 401, and retry can only burn time on it — including SSR burn on hard loads. Pair with retry-except-control-flow, never `retry: false` on reads.
- SSR agreement beats flash-avoidance: where server and first paint must agree (locale-guarded flags, client-only engine gates), the effect stays and says so in a comment.
- Mock timers standing in for real async work keep their effect + cleanup until the real subscription lands.
