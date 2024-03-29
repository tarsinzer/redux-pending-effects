import { createAsyncThunk, ThunkAction } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';

import { nasaService } from '../services/NasaService';
import {
  patentsActionsNames,
  libraryActionNames,
  astronomyPictureActionNames,
  marsRoverPhotosActionNames
} from '../constants';
import { RootState } from '../reducers/rootReducer';

export const getPatents = (): Actions.GetPatents => ({
  type: patentsActionsNames.GET,
  payload: nasaService.getPatents()
});

export const getLibraryContent = createAsyncThunk(
  libraryActionNames.GET,
  async (requestValues: string) =>
    await nasaService.getLibraryContent(requestValues)
);

export const getAstronomyPictureData: Actions.AstronomyPictureTypes = {
  type: astronomyPictureActionNames.GET
};

export const getAstronomyPictureDataLoaded = (
  data: Global.AstronomyPictureDataShape
): Actions.AstronomyPictureTypes => ({
  type: astronomyPictureActionNames.FULFILLED,
  payload: data
});

export const getAstronomyPictureDataRejected = (
  errorMessage: string
): Actions.AstronomyPictureTypes => ({
  type: astronomyPictureActionNames.REJECTED,
  payload: {
    errorMessage
  }
});

export const getMarsRoverPhotosPending = (): Actions.MarsRoverPhotosTypes => ({
  type: marsRoverPhotosActionNames.PENDING
});

export const getMarsRoverPhotosFulFilled = (
  data: Global.MarsRoverPhotoDataShape[]
): Actions.MarsRoverPhotosTypes => ({
  type: marsRoverPhotosActionNames.FULFILLED,
  payload: data
});

export const getMarsRoverPhotosRejected = (
  error: string
): Actions.MarsRoverPhotosTypes => ({
  type: marsRoverPhotosActionNames.REJECTED,
  payload: error
});

export const getMarsRoverPhotos =
  (nasaService: any): ThunkAction<void, RootState, unknown, AnyAction> =>
  async dispatch => {
    dispatch(getMarsRoverPhotosPending());

    try {
      const res = await nasaService.getMarsRoverPhotos();

      dispatch(getMarsRoverPhotosFulFilled(res));
    } catch (error) {
      dispatch(
        getMarsRoverPhotosRejected(
          (error as Error).message || (error as Response).statusText
        )
      );
    }
  };
