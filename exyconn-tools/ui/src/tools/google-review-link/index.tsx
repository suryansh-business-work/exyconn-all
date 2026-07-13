import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Chip,
  Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Tabs, Tab,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { RateReview, ContentCopy, OpenInNew, Search, Star, StoreMallDirectory } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface PlaceResult { name: string; address: string; placeId: string; rating: number | null; totalReviews: number }

const GoogleReviewLink: React.FC = () => {
  const [placeId, setPlaceId] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [businessQuery, setBusinessQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  const handleSearch = async () => {
    if (!businessQuery.trim()) return;
    const apiKey = localStorage.getItem('google_places_api_key') || '';
    if (!apiKey) { setError('Please configure your Google Places API key in the Secrets drawer (key icon).'); return; }
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    try {
      const res = await fetch(APIs.seoTools.placeSearch, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: businessQuery, apiKey }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Search failed');
      setSearchResults(data.data.results || []);
      if (data.data.results.length === 0) setError('No businesses found. Try a more specific search.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: PlaceResult) => {
    setPlaceId(place.placeId);
    setGeneratedLink(`https://search.google.com/local/writereview?placeid=${place.placeId}`);
  };

  const handleGenerate = () => {
    if (!placeId.trim()) return;
    setGeneratedLink(`https://search.google.com/local/writereview?placeid=${placeId.trim()}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ToolLayout toolName="Google Review Link" toolIcon={<RateReview />} toolColor="#f97316">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab icon={<Search />} iconPosition="start" label="Search Business" sx={{ textTransform: 'none', minHeight: 40 }} />
                <Tab icon={<StoreMallDirectory />} iconPosition="start" label="Manual ID" sx={{ textTransform: 'none', minHeight: 40 }} />
              </Tabs>
              {tab === 0 ? (
                <>
                  <TextField fullWidth size="small" label="Business Name & City" placeholder="e.g., Starbucks New York"
                    value={businessQuery} onChange={(e) => setBusinessQuery(e.target.value)} sx={{ mb: 2 }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                  <Button fullWidth variant="contained" onClick={handleSearch} disabled={isSearching || !businessQuery.trim()}
                    startIcon={<Search />} sx={{ textTransform: 'none', bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
                    {isSearching ? 'Searching...' : 'Search Business'}
                  </Button>
                  {isSearching && <LinearProgress sx={{ mt: 1 }} />}
                </>
              ) : (
                <>
                  <TextField fullWidth size="small" label="Google Place ID" placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                    value={placeId} onChange={(e) => setPlaceId(e.target.value)} sx={{ mb: 2 }} />
                  <Button fullWidth variant="contained" onClick={handleGenerate} disabled={!placeId.trim()}
                    startIcon={<RateReview />} sx={{ textTransform: 'none', bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
                    Generate Link
                  </Button>
                  <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
                    Find your Place ID at{' '}
                    <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer">
                      Google Place ID Finder
                    </a>
                  </Alert>
                </>
              )}
            </Paper>
            {searchResults.length > 0 && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Select Your Business</Typography>
                <TableContainer sx={{ maxHeight: 350 }}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Business</TableCell><TableCell align="center">Rating</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                    <TableBody>
                      {searchResults.map((p) => (
                        <TableRow key={p.placeId} hover sx={{ cursor: 'pointer' }} onClick={() => handleSelectPlace(p)}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.address}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            {p.rating && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                              <Star sx={{ fontSize: 14, color: '#f59e0b' }} />
                              <Typography variant="caption">{p.rating} ({p.totalReviews})</Typography>
                            </Box>}
                          </TableCell>
                          <TableCell align="right">
                            <Chip label="Select" size="small" color="primary" clickable onClick={() => handleSelectPlace(p)} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {generatedLink ? (
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Your Review Link</Typography>
                <Box sx={{ bgcolor: 'action.hover', p: 2, mb: 2, wordBreak: 'break-all' }}>
                  <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">{generatedLink}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="contained" startIcon={<ContentCopy />} onClick={handleCopy} sx={{ textTransform: 'none' }}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                    onClick={() => window.open(generatedLink, '_blank')} sx={{ textTransform: 'none' }}>Test Link</Button>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Chip size="small" label="Share via Email" sx={{ mr: 0.5, mb: 0.5 }}
                    onClick={() => window.open(`mailto:?subject=Leave us a review&body=${encodeURIComponent(generatedLink)}`)} />
                  <Chip size="small" label="Share via WhatsApp" sx={{ mr: 0.5, mb: 0.5 }}
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Please leave us a review: ${generatedLink}`)}`)} />
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <RateReview sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Search for your business or enter a Place ID to generate a review link</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
};

export default GoogleReviewLink;
