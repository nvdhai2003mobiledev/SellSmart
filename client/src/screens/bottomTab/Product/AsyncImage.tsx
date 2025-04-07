import React, {useState} from 'react';
import {
  Image,
  ImageProps,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import {color} from '../../../utils/color';

interface AsyncImageProps extends ImageProps {
  retryable?: boolean;
  loadingColor?: string;
}

const AsyncImage = (props: AsyncImageProps) => {
  const {
    style,
    source,
    retryable = true,
    loadingColor = color.primaryColor,
  } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Function to handle image loading failure
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Function to handle image loading success
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Function to retry loading the image
  const retryLoading = () => {
    if (retryCount < 3) {
      setIsLoading(true);
      setHasError(false);
      setRetryCount(retryCount + 1);
    }
  };

  // Fix image URLs if needed
  const getProperImageUrl = (sourceUri: any) => {
    if (!sourceUri || !sourceUri.uri)
      return {uri: 'https://via.placeholder.com/150'};

    const uri = sourceUri.uri;

    // Handle null case
    if (!uri) return {uri: 'https://via.placeholder.com/150'};

    // If already starts with http/https, use as is
    if (uri.startsWith('http')) return sourceUri;

    // Otherwise, prepend the base URL
    return {
      ...sourceUri,
      uri: `http://10.0.2.2:5000${uri}`,
    };
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        {...props}
        source={getProperImageUrl(source)}
        style={[styles.image, style]}
        onLoadStart={() => setIsLoading(true)}
        onLoad={handleLoad}
        onLoadEnd={() => setIsLoading(false)}
        onError={handleError}
      />

      {isLoading && (
        <View style={[styles.loadingContainer, style]}>
          <ActivityIndicator size="small" color={loadingColor} />
        </View>
      )}

      {hasError && (
        <View style={[styles.errorContainer, style]}>
          {retryable && retryCount < 3 ? (
            <TouchableOpacity onPress={retryLoading} style={styles.retryButton}>
              <Text style={styles.retryText}>⟳</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.errorText}>!</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 248, 248, 0.7)',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  retryButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  retryText: {
    fontSize: 18,
    color: color.primaryColor,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 20,
    color: 'rgba(0, 0, 0, 0.5)',
  },
});

export default AsyncImage;
