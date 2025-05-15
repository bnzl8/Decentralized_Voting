import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useWeb3 } from './contexts/Web3Context';
import AdminPanel from './components/AdminPanel';
import VoterPanel from './components/VoterPanel';

const App: React.FC = () => {
  const { account, isAdmin, isWhitelisted, connect, disconnect } = useWeb3();
  const toast = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await connect();
      toast({
        title: 'Connected',
        description: 'Successfully connected to MetaMask',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to MetaMask';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Decentralized Corporate Voting
          </Heading>
          <Text fontSize="xl" color="gray.600">
            Secure and anonymous voting using blockchain technology
          </Text>
        </Box>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {!account ? (
          <Box textAlign="center">
            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleConnect}
              isLoading={isConnecting}
              loadingText="Connecting..."
            >
              Connect Wallet
            </Button>
            {!account && !isConnecting && (
              <Text mt={4} color="gray.600">
                Please make sure you're connected to the Hardhat Local network (Chain ID: 1337)
              </Text>
            )}
          </Box>
        ) : (
          <>
            <Box textAlign="right">
              <Text mb={2}>
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </Text>
              <Text mb={2} color={isAdmin ? "green.500" : isWhitelisted ? "blue.500" : "red.500"}>
                Status: {isAdmin ? "Admin" : isWhitelisted ? "Whitelisted" : "Not Whitelisted"}
              </Text>
              <Button
                colorScheme="red"
                size="sm"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </Box>

            {isAdmin ? (
              <AdminPanel />
            ) : isWhitelisted ? (
              <VoterPanel />
            ) : (
              <Box textAlign="center" p={8} bg="gray.50" borderRadius="md">
                <Text fontSize="lg" color="gray.600">
                  Your address is not whitelisted. Please contact the administrator.
                </Text>
              </Box>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
};

export default App; 