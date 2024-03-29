import { Store } from 'redux';
import { selectIsPending } from 'redux-pending-effects';
import { configureStore } from '@reduxjs/toolkit';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { middleware, sagaMiddleware } from '../store';
import {
  getPatents,
  getLibraryContent,
  getAstronomyPictureData
} from '../actions';
import {
  astronomyPictureActionNames,
  libraryActionNames,
  patentsActionsNames
} from '../constants';
import { astronomyPictureWorker } from '../sagas/astronomyPictureSagas';
import { rootReducer as reducer } from './rootReducer';
import { rootSaga } from '../sagas';
import {
  patentsFetchMock,
  libraryContentFetchMock,
  astronomyPictureFetchMock,
  rejectedFetchMockParam,
  createSagaTesterInstance,
  middlewaresWithPromiseActionsIgnored,
  middlewaresWithToolkitActionsIgnored,
  middlewaresWithSagaActionsIgnored,
  urls,
  REDUX_PENDING_EFFECTS
} from './testHelpers';

describe('selector', () => {
  let store: Store;

  enableFetchMocks();

  beforeEach(() => {
    store = configureStore({ reducer, middleware });
    fetchMock.resetMocks();
  });

  test('should have default negative pending state', () => {
    expect(selectIsPending(store.getState())).toBe(false);
  });

  describe('with saga', () => {
    test('should trigger pending state when saga started', () => {
      sagaMiddleware.run(rootSaga);
      store.dispatch(getAstronomyPictureData);
      expect(selectIsPending(store.getState())).toBe(true);
    });

    test('should save correct name of action, that triggered pending effect', () => {
      sagaMiddleware.run(rootSaga);
      store.dispatch(getAstronomyPictureData);

      const pendingState = store.getState()[REDUX_PENDING_EFFECTS];
      const isTriggeredActionTypeIsPresent = Object.values(
        pendingState.effectsEntity
      ).includes(astronomyPictureActionNames.GET);
      expect(isTriggeredActionTypeIsPresent).toBe(true);
    });

    test('should complete pending state when saga completed with success', async () => {
      const sagaTester = createSagaTesterInstance(middleware);

      fetchMock.mockResponseOnce(...astronomyPictureFetchMock);

      sagaTester.start(rootSaga);
      sagaTester.dispatch(getAstronomyPictureData);
      await sagaTester.waitFor(astronomyPictureActionNames.FULFILLED);
      expect(selectIsPending(sagaTester.getState())).toBe(false);
    });

    test('should complete pending state when saga completed with failure', async () => {
      const sagaTester = createSagaTesterInstance(middleware);

      fetchMock.mockRejectOnce(rejectedFetchMockParam);

      sagaTester.start(rootSaga);
      sagaTester.dispatch(getAstronomyPictureData);
      await sagaTester.waitFor(astronomyPictureActionNames.REJECTED);
      expect(selectIsPending(sagaTester.getState())).toBe(false);
    });

    test('should not trigger pending state when fetch is started for ignored action', () => {
      const store: Store = configureStore({
        reducer,
        middleware: middlewaresWithSagaActionsIgnored
      });

      sagaMiddleware.run(rootSaga);
      store.dispatch(getAstronomyPictureData);
      expect(selectIsPending(store.getState())).toBe(false);
    });
  });

  describe('with toolkit', () => {
    test('should trigger pending state when toolkit started', () => {
      store.dispatch<any>(getLibraryContent('test'));
      expect(selectIsPending(store.getState())).toBe(true);
    });

    test('should save correct name of action, that triggered pending effect', () => {
      store.dispatch<any>(getLibraryContent('test'));

      const pendingState = store.getState()[REDUX_PENDING_EFFECTS];
      const isTriggeredActionTypeIsPresent = Object.values(
        pendingState.effectsEntity
      ).includes(libraryActionNames.PENDING);
      expect(isTriggeredActionTypeIsPresent).toBe(true);
    });

    test('should complete pending state when toolkit completed with success', async () => {
      fetchMock.mockResponseOnce(...libraryContentFetchMock);
      await store.dispatch<any>(getLibraryContent('test'));
      expect(selectIsPending(store.getState())).toBe(false);
    });

    test('should complete pending state when toolkit completed with failure', async () => {
      fetchMock.mockRejectOnce(rejectedFetchMockParam);
      await store.dispatch<any>(getLibraryContent('test'));
      expect(selectIsPending(store.getState())).toBe(false);
    });

    test('should not trigger pending state when fetch is started for ignored action', () => {
      const store: Store = configureStore({
        reducer,
        middleware: middlewaresWithToolkitActionsIgnored
      });

      store.dispatch<any>(getLibraryContent('test'));
      expect(selectIsPending(store.getState())).toBe(false);
    });
  });

  describe('with promise', () => {
    test('should trigger pending state when promise started', () => {
      store.dispatch(getPatents());
      expect(selectIsPending(store.getState())).toBe(true);
    });

    test('should save correct name of action, that triggered pending effect', () => {
      store.dispatch(getPatents());

      const pendingState = store.getState()[REDUX_PENDING_EFFECTS];
      const isTriggeredActionTypeIsPresent = Object.values(
        pendingState.effectsEntity
      ).includes(patentsActionsNames.GET);
      expect(isTriggeredActionTypeIsPresent).toBe(true);
    });

    test('should complete pending state when promise completed with success', async () => {
      fetchMock.mockResponseOnce(...patentsFetchMock);

      const getPatentsAction: Actions.GetPatents = getPatents();

      store.dispatch(getPatentsAction);
      await getPatentsAction.payload;
      expect(selectIsPending(store.getState())).toBe(false);
    });

    test('should complete pending state when promise completed with failure', async () => {
      fetchMock.mockRejectOnce(rejectedFetchMockParam);

      const getPatentsAction: Actions.GetPatents = getPatents();

      try {
        store.dispatch(getPatentsAction);
        await getPatentsAction.payload;
      } catch (e) {
      } finally {
        expect(selectIsPending(store.getState())).toBe(false);
      }
    });

    test('should not trigger pending state when fetch is started for ignored action', () => {
      const store: Store = configureStore({
        reducer,
        middleware: middlewaresWithPromiseActionsIgnored
      });

      store.dispatch(getPatents());
      expect(selectIsPending(store.getState())).toBe(false);
    });
  });

  describe('with all', () => {
    test('should not complete pending state when one of the fetches(sent by promise and toolkit) is completed', async () => {
      fetchMock.mockResponseOnce(...patentsFetchMock);

      const getPatentsAction: Actions.GetPatents = getPatents();

      store.dispatch(getPatentsAction);
      store.dispatch<any>(getLibraryContent('test'));
      await getPatentsAction.payload;
      expect(selectIsPending(store.getState())).toBe(true);
    });

    test('should complete pending state when all fetches(sent by promise and toolkit) are completed', async () => {
      fetchMock.mockResponses(patentsFetchMock, libraryContentFetchMock);

      const getPatentsAction: Actions.GetPatents = getPatents();

      store.dispatch(getPatentsAction);

      await Promise.all([
        store.dispatch<any>(getLibraryContent('test')),
        getPatentsAction.payload
      ]);

      expect(selectIsPending(store.getState())).toBe(false);
    });

    test('should not complete pending state when one of the fetches(sent by promise and saga) is completed', async () => {
      fetchMock.mockResponse(...patentsFetchMock);

      const sagaTester = createSagaTesterInstance(middleware);
      const getPatentsAction: Actions.GetPatents = getPatents();

      sagaTester.start(rootSaga);
      sagaTester.dispatch(getPatentsAction);
      sagaTester.dispatch(getAstronomyPictureData);
      await getPatentsAction.payload;
      expect(selectIsPending(sagaTester.getState())).toBe(true);
    });

    test('should complete pending state when all fetches(sent by promise and saga) are completed', async () => {
      fetchMock.mockResponses(patentsFetchMock, astronomyPictureFetchMock);

      const sagaTester = createSagaTesterInstance(middleware);
      const getPatentsAction: Actions.GetPatents = getPatents();

      sagaTester.start(astronomyPictureWorker);
      sagaTester.dispatch(getPatentsAction);
      sagaTester.dispatch(getAstronomyPictureData);

      await Promise.all([
        getPatentsAction.payload,
        sagaTester.waitFor(astronomyPictureActionNames.FULFILLED)
      ]);

      expect(selectIsPending(sagaTester.getState())).toBe(false);
    });

    test('should not complete pending state when one of the fetches(sent by toolkit and saga) is completed', async () => {
      fetchMock.mockResponseOnce(...astronomyPictureFetchMock);

      const sagaTester = createSagaTesterInstance(middleware);

      sagaTester.start(rootSaga);
      sagaTester.dispatch(getAstronomyPictureData);
      sagaTester.dispatch(getLibraryContent('test'));
      await sagaTester.waitFor(astronomyPictureActionNames.FULFILLED);
      expect(selectIsPending(sagaTester.getState())).toBe(true);
    });

    test('should complete pending state when all fetches(sent by toolkit and saga) are completed', async () => {
      fetchMock.mockResponses(
        libraryContentFetchMock,
        astronomyPictureFetchMock
      );

      const sagaTester = createSagaTesterInstance(middleware);
      const libraryContentPromise = sagaTester.dispatch(
        getLibraryContent('test')
      );

      sagaTester.start(rootSaga);
      sagaTester.dispatch(getAstronomyPictureData);

      // eslint-disable-next-line compat/compat
      await Promise.all([
        libraryContentPromise,
        sagaTester.waitFor(astronomyPictureActionNames.FULFILLED)
      ]);

      expect(selectIsPending(sagaTester.getState())).toBe(false);
    });

    describe('when ignore', () => {
      test(`should not complete pending state when fetch is completed for ignored action, but isn't completed for tracked action (saga is ignored)`, async () => {
        fetchMock.mockResponseOnce(...astronomyPictureFetchMock);

        const sagaTester = createSagaTesterInstance(
          middlewaresWithSagaActionsIgnored
        );

        sagaTester.start(rootSaga);
        sagaTester.dispatch(getAstronomyPictureData);
        sagaTester.dispatch(getLibraryContent('test'));
        await sagaTester.waitFor(astronomyPictureActionNames.FULFILLED);
        expect(selectIsPending(sagaTester.getState())).toBe(true);
      });

      test(`should not complete pending state when fetch is completed for ignored action, but isn't completed for tracked action (toolkit is ignored)`, async () => {
        fetchMock.mockResponseOnce(...libraryContentFetchMock);
        fetchMock.dontMockIf(urls.PATENTS);

        const store: Store = configureStore({
          reducer,
          middleware: middlewaresWithToolkitActionsIgnored
        });

        store.dispatch(getPatents());
        await store.dispatch<any>(getLibraryContent('test'));
        expect(selectIsPending(store.getState())).toBe(true);
      });

      test(`should not complete pending state when fetch is completed for ignored action, but isn't completed for tracked action (promise is ignored)`, async () => {
        fetchMock.mockResponseOnce(...patentsFetchMock);

        const store: Store = configureStore({
          reducer,
          middleware: middlewaresWithPromiseActionsIgnored
        });
        const getPatentsAction: Actions.GetPatents = getPatents();

        store.dispatch(getPatentsAction);
        store.dispatch<any>(getLibraryContent('test'));
        await getPatentsAction.payload;
        expect(selectIsPending(store.getState())).toBe(true);
      });
    });
  });
});
