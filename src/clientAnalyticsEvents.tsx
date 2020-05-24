import React from "react";
import { v4 as uuid } from "uuid";
import { analyticsThunk } from "./firebase";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { EventMap, Event, makeEvent } from "./analyticsEvents";

const userId = getOrCreateFromStorage(localStorage, "id", () => uuid());
const sessionId = getOrCreateFromStorage(sessionStorage, "id", () => uuid());

const analytics = analyticsThunk();
analytics.setUserId(userId);

interface AnalyticsContextType {
  unsentEvents: Event<any>[];
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  unsentEvents: [],
});

interface Props {
  children: any;
}

export const AnalyticsProvider = (props: Props) => {
  const { current: unsentEvents } = useRef<Event<any>[]>([]);

  useEffect(() => {
    async function sendAnalyticsEvents() {
      if (!unsentEvents.length) {
        return;
      }

      const processingEvents = unsentEvents.slice();
      try {
        const response = await fetch(
          "https://us-central1-wordsearch-172001.cloudfunctions.net/eventsIngest",
          {
            mode: "cors",
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              userId,
              sessionId,
              events: processingEvents,
            }),
          }
        );

        if (response.status !== 200) {
          return;
        }
      } catch (e) {
        console.error(e);
        return;
      }

      unsentEvents.splice(0, processingEvents.length);
    }

    let timeout: NodeJS.Timeout;
    function scheduleNextSend() {
      timeout = setTimeout(async () => {
        await sendAnalyticsEvents();
        scheduleNextSend();
      }, 500);
    }

    scheduleNextSend();

    return () => clearTimeout(timeout);
  }, [unsentEvents]);

  return (
    <AnalyticsContext.Provider value={{ unsentEvents }}>
      {props.children}
    </AnalyticsContext.Provider>
  );
};

type TrackEventFn = <K extends keyof EventMap>(
  name: K,
  properties: EventMap[K]
) => void;

export function useTrack(): TrackEventFn {
  const context = useContext(AnalyticsContext);

  return useCallback(
    <K extends keyof EventMap>(name: K, properties: EventMap[K]) => {
      const event = makeEvent(name, properties);
      context.unsentEvents.push(event);
    },
    [context]
  );
}

export function useTrackViewed<K extends keyof EventMap>(
  key: K,
  properties: EventMap[K]
) {
  const track = useTrack();
  useEffect(() => track(key, properties), []);
}

export function useTrackFn<K extends keyof EventMap>(
  key: K,
  properties: EventMap[K]
) {
  const track = useTrack();

  return useCallback(() => track(key, properties), []);
}

function getOrCreateFromStorage(
  storage: Storage,
  key: string,
  create: () => string
): string {
  const item = storage.getItem(key);
  if (item) {
    return item;
  }

  const newItem = create();
  storage.setItem(key, newItem);
  return newItem;
}
