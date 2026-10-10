import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLogoState } from '../../tools/logo-set/useLogoState';
import { DEFAULT_SETTINGS } from '../../tools/logo-set/types';

beforeEach(() => localStorage.clear());

const changed = { ...DEFAULT_SETTINGS, scale: 1.5 };

describe('useLogoState', () => {
  it('restores everything that was saved', () => {
    localStorage.setItem(
      'logo-set-state',
      JSON.stringify({
        image: 'data:saved',
        globalSettings: changed,
        sizeSettings: { 'icon-48': changed },
        croppedImages: { 'icon-48': 'data:crop' },
        format: 'webp',
        customSizes: [{ id: 'c1', width: 10, height: 20, label: 'Ten' }],
      })
    );
    const { result } = renderHook(() => useLogoState());
    expect(result.current.image).toBe('data:saved');
    expect(result.current.settings.scale).toBe(1.5);
    expect(result.current.format).toBe('webp');
    expect(result.current.customSizes).toHaveLength(1);
    expect(result.current.croppedImages).toEqual({ 'icon-48': 'data:crop' });
    expect(result.current.hasCustomChanges).toBe(true);
  });

  it('records uploads in the history, saves them, and undoes/redoes them', () => {
    const { result } = renderHook(() => useLogoState());
    expect(result.current.hasCustomChanges).toBe(false);
    act(() => result.current.handleImageUpload('data:one'));
    act(() => result.current.handleImageUpload('data:two'));
    expect(result.current.image).toBe('data:two');
    expect(JSON.parse(localStorage.getItem('logo-set-state') as string).image).toBe('data:two');

    act(() => result.current.handleUndo());
    expect(result.current.image).toBe('data:one');
    act(() => result.current.handleRedo());
    expect(result.current.image).toBe('data:two');

    act(() => result.current.handleImageUpload(null));
    expect(result.current.image).toBeNull();
  });

  it('leaves the image alone when there is nothing to undo or redo', () => {
    const { result } = renderHook(() => useLogoState());
    act(() => result.current.handleUndo());
    act(() => result.current.handleRedo());
    expect(result.current.image).toBeNull();
  });

  it('adds and removes cropped images and per-size settings', () => {
    const { result } = renderHook(() => useLogoState());
    act(() => result.current.handleCroppedImage('icon-48', 'data:crop'));
    expect(result.current.croppedImages).toEqual({ 'icon-48': 'data:crop' });
    act(() => result.current.handleCroppedImage('icon-48', ''));
    expect(result.current.croppedImages).toEqual({});

    act(() => result.current.handleSizeSettings('logo-128', changed));
    expect(result.current.sizeSettings).toEqual({ 'logo-128': changed });
    act(() => result.current.handleSizeSettings('logo-128', null));
    expect(result.current.sizeSettings).toEqual({});
  });

  it('only changes the global settings while the scope is all', () => {
    const { result } = renderHook(() => useLogoState());
    act(() => result.current.handleSettingsChange(changed));
    expect(result.current.settings.scale).toBe(1.5);
    expect(result.current.sizeSettings).toEqual({});
  });

  it('copies settings to every size in a category scope', () => {
    const { result } = renderHook(() => useLogoState());
    act(() => result.current.setApplyScope('favicon-all'));
    act(() => result.current.handleSettingsChange(changed));
    expect(Object.keys(result.current.sizeSettings).sort()).toEqual(['favicon-16', 'favicon-32', 'favicon-48']);
  });

  it('copies settings to the custom sizes for the custom scope', () => {
    const { result } = renderHook(() => useLogoState());
    act(() => result.current.setCustomSizes([{ id: 'a', width: 1, height: 1, label: 'A' }]));
    act(() => result.current.setApplyScope('custom-all'));
    act(() => result.current.handleSettingsChange(changed));
    expect(Object.keys(result.current.sizeSettings)).toEqual(['custom-a']);
  });

  it('copies settings to one size for a single-size scope, and to none for an unknown scope', () => {
    const { result } = renderHook(() => useLogoState());
    act(() => result.current.setApplyScope('icon-64'));
    act(() => result.current.handleSettingsChange(changed));
    expect(Object.keys(result.current.sizeSettings)).toEqual(['icon-64']);

    act(() => result.current.setApplyScope('splash-480x800'));
    act(() => result.current.handleSettingsChange({ ...changed, scale: 2 }));
    expect(Object.keys(result.current.sizeSettings)).toEqual(['icon-64']);
  });

  it('resets settings but keeps the image, and deletes everything on delete', () => {
    const { result } = renderHook(() => useLogoState());
    act(() => result.current.handleImageUpload('data:one'));
    act(() => result.current.handleSettingsChange(changed));
    act(() => result.current.handleCroppedImage('icon-48', 'data:crop'));
    act(() => result.current.handleReset());
    expect(result.current.image).toBe('data:one');
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.current.croppedImages).toEqual({});

    act(() => result.current.setCustomSizes([{ id: 'a', width: 1, height: 1, label: 'A' }]));
    act(() => result.current.setApplyScope('icon-all'));
    act(() => result.current.handleDelete());
    expect(result.current.image).toBeNull();
    expect(result.current.customSizes).toEqual([]);
    expect(result.current.history.imageHistory).toEqual([]);
  });
});
